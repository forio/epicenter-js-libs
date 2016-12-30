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
 * v2.0.1
 * https://github.com/forio/epicenter-js-libs
 */

var F = {
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

F.store.Cookie = require('./store/cookie-store');
F.factory.Store = require('./store/store-factory');

F.manager.ScenarioManager = require('./managers/scenario-manager');
F.manager.RunManager = require('./managers/run-manager');
F.manager.AuthManager = require('./managers/auth-manager');
F.manager.WorldManager = require('./managers/world-manager');
F.manager.SavedRunsManager = require('./managers/saved-run-manager');

var strategies = require('./managers/run-strategies');
F.manager.strategy = strategies.list; //TODO: this is not really a manager so namespace this better

F.manager.ChannelManager = require('./managers/epicenter-channel-manager');
F.service.Channel = require('./service/channel-service');

F.version = '2.0.1';
F.api = require('./api-version.json');

global.F = F;
module.exports = F;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./api-version.json":3,"./env-load":5,"./managers/auth-manager":6,"./managers/epicenter-channel-manager":8,"./managers/run-manager":10,"./managers/run-strategies":13,"./managers/saved-run-manager":21,"./managers/scenario-manager":22,"./managers/world-manager":26,"./service/admin-file-service":27,"./service/asset-api-adapter":28,"./service/auth-api-service":29,"./service/channel-service":30,"./service/configuration-service":31,"./service/data-api-service":32,"./service/group-api-service":33,"./service/introspection-api-service":34,"./service/member-api-adapter":35,"./service/run-api-service":36,"./service/state-api-adapter":38,"./service/url-config-service":39,"./service/user-api-adapter":40,"./service/variables-api-service":41,"./service/world-api-adapter":42,"./store/cookie-store":43,"./store/store-factory":45,"./transport/ajax-http-transport":46,"./transport/http-transport-factory":47,"./util/inherit":48,"./util/query-util":51,"./util/run-util":52}],5:[function(require,module,exports){
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

},{"./service/url-config-service":39}],6:[function(require,module,exports){
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

},{"../service/auth-api-service":29,"../service/group-api-service":33,"../service/member-api-adapter":35,"../store/session-manager":44,"../util/object-util":49,"Base64":1,"object-assign":2}],7:[function(require,module,exports){
'use strict';

/**
 * ## Channel Manager
 *
 * There are two main use cases for the channel: event notifications and chat messages.
 *
 * The Channel Manager is a wrapper around the default [cometd JavaScript library](http://docs.cometd.org/2/reference/javascript.html), `$.cometd`. It provides a few nice features that `$.cometd` doesn't, including:
 *
 * * Automatic re-subscription to channels if you lose your connection
 * * Online / Offline notifications
 * * 'Events' for cometd notifications (instead of having to listen on specific meta channels)
 *
 * While you can work directly with the Channel Manager through Node.js (for example, `require('manager/channel-manager')`) -- or even work directly with `$.cometd` and Epicenter's underlying [Push Channel API](../../../rest_apis/multiplayer/channel/) -- most often it will be easiest to work with the [Epicenter Channel Manager](../epicenter-channel-manager/). The Epicenter Channel Manager is a wrapper that instantiates a Channel Manager with Epicenter-specific defaults.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Manager. (See [Including Epicenter.js](../../#include).)
 *
 * To use the Channel Manager in client-side JavaScript, instantiate the [Epicenter Channel Manager](../epicenter-channel-manager/), get the channel, then use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 *        var cm = new F.manager.ChannelManager();
 *        var channel = cm.getChannel();
 *
 *        channel.subscribe('topic', callback);
 *        channel.publish('topic', { myData: 100 });
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
         * Whether the ACK extension is enabled. See https://docs.cometd.org/current/reference/#_extensions_acknowledge for more info.
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

},{"../service/channel-service":30,"../store/session-manager":44}],8:[function(require,module,exports){
'use strict';

/**
 * ## Epicenter Channel Manager
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.
 *
 * The Epicenter Channel Manager is a wrapper around the (more generic) [Channel Manager](../channel-manager/), to instantiate it with Epicenter-specific defaults. If you are interested in including a notification or chat feature in your project, using an Epicenter Channel Manager is probably the easiest way to get started.
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Epicenter Channel Manager. See [Including Epicenter.js](../../#include).
 *
 * To use the Epicenter Channel Manager: instantiate it, get the channel of the scope you want ([user](../../../glossary/#users), [world](../../../glossary/#world), or [group](../../../glossary/#groups)), then use the channel's `subscribe()` and `publish()` methods to subscribe to topics or publish data to topics.
 *
 *     var cm = new F.manager.ChannelManager();
 *     var gc = cm.getGroupChannel();
 *     gc.subscribe('broadcasts', callback);
 *
 * For additional background on Epicenter's push channel, see the introductory notes on the [Push Channel API](../../../rest_apis/multiplayer/channel/) page.
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
var classFrom = require('../util/inherit');
var urlService = require('../service/url-config-service');
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
var __super = ChannelManager.prototype;
var EpicenterChannelManager = classFrom(ChannelManager, {
    constructor: function (options) {
        this.sessionManager = new SessionManager(options);
        var defaultCometOptions = this.sessionManager.getMergedOptions(options);

        var urlOpts = urlService(defaultCometOptions.server);
        if (!defaultCometOptions.url) {
            //Default epicenter cometd endpoint
            defaultCometOptions.url = urlOpts.protocol + '://' + urlOpts.host + '/channel/subscribe';
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
        return __super.getChannel.call(this, { base: baseTopic });
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
     * Create and return a publish/subscribe channel (from the underlying [Channel Manager](../channel-manager/)) that automatically tracks the presence of an [end user](../../../glossary/#users), that is, whether the end user is currently online in this group and world. Notifications are automatically sent when the end user comes online, and when the end user goes offline (not present for more than 2 minutes). Useful in multiplayer games for letting each end user know whether other users in their shared world are also online.
     *
     * **Example**
     *
     *     var cm = new F.manager.ChannelManager();
     *     var worldManager = new F.manager.WorldManager({
     *         account: 'acme-simulations',
     *         project: 'supply-chain-game',
     *         model: 'model.eqn'
     *     });
     *     worldManager.getCurrentWorld().then(function (worldObject, worldService) {
     *         var presenceChannel = cm.getPresenceChannel(worldObject);
     *         presenceChannel.on('presence', function (evt, notification) {
     *              console.log(notification.online, notification.userId);
     *          });
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
     * @param  {String|Object} userid (Optional) User object or id. If not provided, picks up user id from current session if end user is logged in.
     * @param  {String} groupName (Optional) Group the world exists in. If not provided, picks up group from current session if end user is logged in.
     * @return {Channel} Channel instance
     */
    getPresenceChannel: function (world, userid, groupName) {
        var worldid = ($.isPlainObject(world) && world.id) ? world.id : world;
        if (!worldid) {
            throw new Error('Please specify a world id');
        }

        var session = this.sessionManager.getMergedOptions(this.options);
        userid = getFromSessionOrError(userid, 'userId', session);
        groupName = getFromSessionOrError(groupName, 'groupName', session);

        var account = getFromSessionOrError('', 'account', session);
        var project = getFromSessionOrError('', 'project', session);

        var baseTopic = ['/user', account, project, groupName, worldid].join('/');
        var channel = __super.getChannel.call(this, { base: baseTopic });

        var lastPingTime = { };

        var PING_INTERVAL = 6000;
        channel.subscribe('internal-ping-channel', function (notification) {
            var incomingUserId = notification.data.user;
            if (!lastPingTime[incomingUserId] && incomingUserId !== userid) {
                channel.trigger('presence', { userId: incomingUserId, online: true });
            }
            lastPingTime[incomingUserId] = (new Date()).valueOf();
        });

        setInterval(function () {
            channel.publish('internal-ping-channel', { user: userid });

            $.each(lastPingTime, function (key, value) {
                var now = (new Date()).valueOf();
                if (value && value + (PING_INTERVAL * 2) < now) {
                    lastPingTime[key] = null;
                    channel.trigger('presence', { userId: key, online: false });
                }
            });
        }, PING_INTERVAL);

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
                    date: payload.data.date
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

},{"../service/url-config-service":39,"../store/session-manager":44,"../util/inherit":48,"./channel-manager":7}],9:[function(require,module,exports){
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
* There are many ways to create new runs, including the Epicenter.js [Run Service](../run-api-service/), the RESFTful [Run API](../../../rest_apis/aggregate_run_api) and the [Model Run API](../../../rest_apis/other_apis/model_apis/run/). However, for some projects it makes more sense to pick up where the user left off, using an existing run. And in some projects, whether to create a new run or use an existing one is conditional, for example based on characteristics of the existing run or your own knowledge about the model. The Run Manager provides this level of control: your call to `getRun()`, rather than always returning a new run, returns a run based on the strategy you've specified. (Note that many of the Epicenter sample projects use a Run Service directly, because generally the sample projects are played in one end user session and don't care about run states or run strategies.)
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
*       * `files`: (optional) If and only if you are using a Vensim model and you have additional data to pass in to your model, you can pass a `files` object with the names of the files, for example: `"files": {"data": "myExtraData.xls"}`. (Note that you'll also need to add this same files object to your Vensim [configuration file](../../../model_code/vensim/).) See the [underlying Model Run API](../../../rest_apis/other_apis/model_apis/run/#post-creating-a-new-run-for-this-project) for additional information.
*
*   * `strategy`: (optional) Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../strategies/) for details. Defaults to `new-if-initialized`.
*
*   * `sessionKey`: (optional) Name of browser cookie in which to store run information, including run id. Many conditional strategies, including the provided strategies, rely on this browser cookie to store the run id and help make the decision of whether to create a new run or use an existing one. The name of this cookie defaults to `epicenter-scenario` and can be set with the `sessionKey` parameter.
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
*           strategy: 'always-new',
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

function setRunInSession(sessionKey, runid, sessionManager) {
    if (sessionKey) {
        //TODO: Put the entire  runobject in session? This'll help things like the baseline strategy determine if it's good enough without making an ajax call
        sessionManager.getStore().set(sessionKey, JSON.stringify({ runId: runid }));
    }
}

var defaults = {
    sessionKey: keyNames.STRATEGY_SESSION_KEY,

    /**
     * Run creation strategy for when to create a new run and when to reuse an end user's existing run. See [Run Manager Strategies](../strategies/) for details. Defaults to `new-if-initialized`.
     * @type {String}
     */
    strategy: 'new-if-initialized'
};

function RunManager(options) {
    this.options = $.extend(true, {}, defaults, options);

    if (this.options.run instanceof RunService) {
        this.run = this.options.run;
    } else if (this.options.run) {
        this.run = new RunService(this.options.run);
    } else {
        throw new Error('No run options passed to RunManager');
    }
    patchRunService(this.run, this);

    var StrategyCtor = typeof this.options.strategy === 'function' ? this.options.strategy : strategies.get(this.options.strategy);
    if (!StrategyCtor) {
        throw new Error('Specified run creation strategy was invalid:', this.options.strategy);
    }
    var strategy = new StrategyCtor(this.options);
    if (!strategy.getRun || !strategy.reset) {
        throw new Error('All strategies should implement a `getRun` and `reset` interface', this.options.strategy);
    }
    strategy.requiresAuth = StrategyCtor.requiresAuth;
    this.strategy = strategy;

    this.sessionManager = new SessionManager(this.options);
}

RunManager.prototype = {
    /**
     * Returns the run object for a 'good' run.
     *
     * A good run is defined by the strategy. For example, if the strategy is `always-new`, the call
     * to `getRun()` always returns a newly created run; if the strategy is `new-if-persisted`,
     * `getRun()` creates a new run if the previous run is in a persisted state, otherwise
     * it returns the previous run. See [Run Manager Strategies](../strategies/) for more on strategies.
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
     * @param {Array} variables (Optional) if provided it'll populate the run it gets with the provided variables.
     * @param {Object} options (Optional) these will be passed on to RunService#create if the strategy does create a new run
     * @return {$promise} Promise to complete the call.
     */
    getRun: function (variables, options) {
        var me = this;
        var sessionStore = this.sessionManager.getStore();
        var runSession = JSON.parse(sessionStore.get(this.options.sessionKey) || '{}');
        var runid = runSession && runSession.runId;

        var authSession = this.sessionManager.getSession();
        if (this.strategy.requiresAuth && util.isEmpty(authSession)) {
            console.error('No user-session available', this.options.strategy, 'requires authentication.');
            return $.Deferred().reject('No user-session available').promise();
        }
        return this.strategy
                .getRun(this.run, authSession, runid, options).then(function (run) {
                    if (run && run.id) {
                        setRunInSession(me.options.sessionKey, run.id, me.sessionManager);
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
     * Returns the run object for a new run, regardless of strategy: force creation of a new run.
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
                setRunInSession(me.options.sessionKey, run.id, me.sessionManager);
                me.run.updateConfig({ filter: run.id });
            }
            return run;
        });
    }
};

RunManager.strategies = strategies;
module.exports = RunManager;

},{"../service/run-api-service":36,"../store/session-manager":44,"../util/object-util":49,"./key-names":9,"./run-strategies":13,"./special-operations":25}],11:[function(require,module,exports){
/**
 * The `always-new` strategy always creates a new run for this end user irrespective of current state. This is equivalent to calling `F.service.Run.create()` from the [Run Service](../run-api-service/) every time. 
 * 
 * This strategy means that every time your end users refresh their browsers, they get a new run. 
 * 
 * This strategy can be useful for basic, single-page projects. This strategy is also useful for prototyping or project development: it creates a new run each time you refresh the page, and you can easily check the outputs of the model. However, typically you will use one of the other strategies for a production project.
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

},{"../../util/inherit":48,"./conditional-creation-strategy":12}],12:[function(require,module,exports){
'use strict';

var Base = require('./none-strategy');
var classFrom = require('../../util/inherit');

/**
* Conditional Creation Strategy
* This strategy will try to get the run stored in the cookie and
* evaluate if needs to create a new run by calling the 'condition' function
*/

var Strategy = classFrom(Base, {
    constructor: function Strategy(condition) {
        if (condition == null) { //eslint-disable-line
            //TODO: not sure why this is explicitly ==
            throw new Error('Conditional strategy needs a condition to create a run');
        }
        this.condition = typeof condition !== 'function' ? function () { return condition; } : condition;
    },

    /**
     * Resets current run
     * @param  {RunService} runService  a Run Service instance for the 'current run' as determined by the Run Manager
     * @param  {Object} userSession Information about the current user seesion. See AuthManager#getCurrentUserSession for format
     * @param  {Object} options (Optional) See RunService#create for supported options
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
     * Gets the 'correct' run (the definition of 'currect' depends on strategy implementation)
     * @param  {RunService} runService  a Run Service instance for the 'current run' as determined by the Run Manager
     * @param  {Object} userSession Information about the current user seesion. See AuthManager#getCurrentUserSession for format
     * @param  {String} runIdInSession the RunManager stores the 'last accessed' run in a cookie;  this refers to the last-used runid
     * @param  {Object} options (Optional) See RunService#create for supported options
     * @return {Promise}             
     */
    getRun: function (runService, userSession, runIdInSession, options) {
        var me = this;
        if (runIdInSession) {
            return this.loadAndCheck(runService, userSession, runIdInSession, options).catch(function () {
                return me.reset(runService, userSession, options); //if it got the wrong cookie for e.g.
            });
        } else {
            return this.reset(runService, userSession, options);
        }
    },

    loadAndCheck: function (runService, userSession, runIdInSession, options) {
        var shouldCreate = false;
        var me = this;

        return runService
            .load(runIdInSession, null, {
                success: function (run, msg, headers) {
                    shouldCreate = me.condition(run, headers);
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

},{"../../util/inherit":48,"./none-strategy":18}],13:[function(require,module,exports){
var list = {
    'new-if-initialized': require('./new-if-initialized-strategy'),
    'new-if-persisted': require('./new-if-persisted-strategy'),
    'new-if-missing': require('./new-if-missing-strategy'),
    'always-new': require('./always-new-strategy'),
    multiplayer: require('./multiplayer-strategy'),
    'persistent-single-player': require('./persistent-single-player-strategy'),
    none: require('./none-strategy'),
    baseline: require('../scenario-strategies/baseline-strategy'),
    'new-if-stepped': require('../scenario-strategies/last-unsaved'),
    'conditional-creation': require('./conditional-creation-strategy'),
    'reuse-last-initialized': require('./reuse-last-initialized'),
};

module.exports = {
    /**
     * List available strategies
     * @type {Object} key is strategy name and value is the strategy constructor
     */
    list: list,

    /**
     * Get strategy by name
     * @param  {String} strategyName Name of strategy to get
     * @return {Function}              Strategy function
     */
    get: function (strategyName) {
        return list[strategyName];
    },

    /**
     * Adds a new strategy
     * @param  {String} name     Name for strategy. This string can then be passed to a RunManager as `new F.manager.RunManager({ scenario: 'mynewname'})`
     * @param  {Function} strategy Your strategy constructor. Will be called with `new` on RunManager initialization
     * @param  {Object} options  Options for strategy
     * @param  {Boolean} options.requiresAuth Specify if the strategy requires an valid user-session to work
     */
    register: function (name, strategy, options) {
        strategy.options = options;
        list[name] = strategy;
    }
};
},{"../scenario-strategies/baseline-strategy":23,"../scenario-strategies/last-unsaved":24,"./always-new-strategy":11,"./conditional-creation-strategy":12,"./multiplayer-strategy":14,"./new-if-initialized-strategy":15,"./new-if-missing-strategy":16,"./new-if-persisted-strategy":17,"./none-strategy":18,"./persistent-single-player-strategy":19,"./reuse-last-initialized":20}],14:[function(require,module,exports){
/**
 * The `multiplayer` strategy is for use with [multiplayer worlds](../../../glossary/#world). It checks the current world for this end user, and always returns the current run for that world. This is equivalent to calling `getCurrentWorldForUser()` and then `getCurrentRunId()` from the [World API Adapater](../world-api-adapter/).
 * 
 * Using this strategy means that end users in projects with multiplayer worlds always see the most current run and world. This ensures that they are in sync with the other end users sharing their world and run. In turn, this allows for competitive or collaborative multiplayer projects.
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

},{"../../service/world-api-adapter":42,"../../util/inherit":48,"./none-strategy":18}],15:[function(require,module,exports){
/**
 * The `new-if-initialized` strategy creates a new run if the current one is in memory or has its `initialized` field set to `true`. The `initialized` field in the run record is automatically set to `true` at run creation for Vensim models; it can be set manually for other models.
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
 */

'use strict';
var classFrom = require('../../util/inherit');
var ConditionalStrategy = require('./conditional-creation-strategy');

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

},{"../../util/inherit":48,"./conditional-creation-strategy":12}],16:[function(require,module,exports){
/**
 * The `new-if-missing` strategy creates a new run when the current one is not in the browser cookie.
 * 
 * Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run.
 *
 * This strategy is useful if your project is structured such that immediately after a run is created, the model is executed completely (for example, a Vensim model that is stepped to the end as soon as it is created). In other words, you care whether you have a run, but as long as you have one, you are certain that this run is the one you are interested in. 
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie.
 *     * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options. 
 *     * If the cookie exists, use the run id stored there. 
 *     * If the cookie does not exist, create a new run for this end user. 
 */

//TODO: Rename this as 'new run per session?';
//
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

},{"../../util/inherit":48,"./conditional-creation-strategy":12}],17:[function(require,module,exports){
/**
 * The `new-if-persisted` strategy creates a new run when the current one becomes persisted (end user is idle for a set period), but otherwise uses the current one. 
 * 
 * Using this strategy means that when end users navigate between pages in your project, or refresh their browsers, they will still be working with the same run. 
 * 
 * However, if they are idle for longer than your project's **Model Session Timeout** (configured in your project's [Settings](../../../updating_your_settings/)), then their run is persisted; the next time they interact with the project, they will get a new run. (See more background on [Run Persistence](../../../run_persistence/).)
 * 
 * This strategy is useful for multi-page projects where end users play through a simulation in one sitting, stepping through the model sequentially (for example, a Vensim model that uses the `step` operation) or calling specific functions until the model is "complete." However, you will need  to guarantee that your end users will remain engaged with the project from beginning to end &mdash; or at least, if they are idle for longer than the **Model Session Timeout**, that it is okay for them to start the project from scratch (with an uninitialized model). 
 * 
 * Specifically, the strategy is:
 *
 * * Check the `sessionKey` cookie.
 *   * This cookie is set by the [Run Manager](../run-manager/) and configurable through its options.
 *   * If the cookie exists, check whether the run is in memory or only persisted in the database. 
 *      * If the run is in memory, use the run.
 *      * If the run is only persisted (and not still in memory), create a new run for this end user.
 *      * If the cookie does not exist, create a new run for this end user.
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
        return headers.getResponseHeader('pragma') === 'persistent';
    }
});

module.exports = Strategy;

},{"../../util/inherit":48,"./conditional-creation-strategy":12}],18:[function(require,module,exports){
/**
 * The `none` strategy never returns a run or tries to create a new run. It simply returns the contents of the current [Run Service instance](../run-api-service/).
 * 
 * This strategy is useful if you want to manually decide how to create your own runs and don't want any automatic assistance. 
 * 
 * Also, this strategy is necessary if you are working with a multiplayer project and using the [World Manager](../world-manager/) &mdash; or other, similar situations where you do not have direct control over creating the [Run Service](../run-api-service/) instance.
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

    getRun: function () {
        // return a usable run
        return $.Deferred().resolve(this.runService).promise();
    }
});

},{"../../util/inherit":48}],19:[function(require,module,exports){
/**
 * The `persistent-single-player` strategy returns the latest (most recent) run for this user, whether it is in memory or not. If there are no runs for this user, it creates a new one.
 *
 * This strategy is useful if your project executes your model step by step (as opposed to a project where the model is executed completely, for example, a Vensim model that is immediately stepped to the end). It is useful if end users play with your project for an extended period of time, possibly over several sessions.
 *
 * Specifically, the strategy is:
 * 
 * * Check if there are any runs for this end user.
 *     * If there are no runs (either in memory or in the database), create a new one.
 *     * If there are runs, take the latest (most recent) one.
 *         * If the most recent run is currently in the database, bring it back into memory so that the end user can continue working with it. (See more background on [Run Persistence](../../../run_persistence/), or read more on the underlying [State API](../../../rest_apis/other_apis/model_apis/state/) for bringing runs from the database back into memory.) 
 */

'use strict';

var classFrom = require('../../util/inherit');
var IdentityStrategy = require('./none-strategy');
var StateApi = require('../../service/state-api-adapter');

var defaults = {};

var Strategy = classFrom(IdentityStrategy, {
    constructor: function Strategy(options) {
        this.options = $.extend(true, {}, defaults, options);
        this.stateApi = new StateApi();
    },

    reset: function (runService, userSession, options) {
        var group = userSession.groupName;
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

    getRun: function (runService, userSession, runIdInSession, options) {
        var me = this;
        var params = {
            'scope.group': userSession.groupName
        };
        if (userSession.userId) {
            params['user.id'] = userSession.userId;
        }
        return runService.query(params).then(function (runs) {
            return me._loadAndCheck(runService, userSession, runs, options);
        });
    },

    _loadAndCheck: function (runService, userSession, runs, options) {
        if (!runs || !runs.length) {
            return this.reset(runService, userSession, options);
        }

        var dateComp = function (a, b) { return new Date(b.date) - new Date(a.date); };
        var latestRun = runs.sort(dateComp)[0];
        var me = this;
        var shouldReplay = false;

        return runService.load(latestRun.id, null, {
            success: function (run, msg, headers) {
                //TODO: Not sure this is needed anymore since we auto-bring back into memory
                shouldReplay = headers.getResponseHeader('pragma') === 'persistent';
            }
        }).then(function (run) {
            if (shouldReplay) {
                return me.stateApi.replay({ runId: run.id })
                    .then(function (resp) {
                        return runService.load(resp);
                    });
            }
            return run;
        });
    },

}, { requiresAuth: true });

module.exports = Strategy;

},{"../../service/state-api-adapter":38,"../../util/inherit":48,"./none-strategy":18}],20:[function(require,module,exports){
'use strict';
var classFrom = require('../../util/inherit');

var Base = {};

var defaults = {
    /**
     * Operations to run in the model for initialization to be considered complete.
     * @type {Array} Can be in any of the formats Runservice#serial supports
     */
    initOperation: [],

    /**
     * (Optional) Flag to set in run after initialization operation is run. You'd typically not override this unless you need to set additional properties as well.
     * @type {Object}
     */
    flag: null,
};
module.exports = classFrom(Base, {
    constructor: function (options) {
        this.options = $.extend(true, {}, defaults, options.strategyOptions);
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
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

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

    getRun: function (runService, userSession, runIdInSession, options) {
        var filter = this.options.flag;
        if (userSession && userSession.groupName) {
            filter['scope.group'] = userSession.groupName;
        }
        if (userSession && userSession.userId) {
            filter['user.id'] = userSession.userId;
        }
        var me = this;
        return runService.filter(filter, { 
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
},{"../../util/inherit":48}],21:[function(require,module,exports){
'use strict';

var RunService = require('../service/run-api-service');
var SessionManager = require('../store/session-manager');

var SavedRunsManager = function (config) {
    var defaults = {

    };
    var options = $.extend(true, {}, defaults, config);
    if (options.run) {
        if (options.run instanceof RunService) {
            this.runService = options.run;
        } else {
            var sm = new SessionManager(options.run);
            var mergedOpts = sm.getMergedOptions({}, options.run);
            this.runService = new RunService(mergedOpts);
        }
    } else {
        throw new Error('No run options passed to SavedRunsManager');
    }
};

SavedRunsManager.prototype = {
    mark: function (run, toMark) {
        var rs;
        if (run instanceof RunService) {
            rs = run;
        } else if (!(typeof Run === 'string')) {
            var existingOptions = this.runService.getCurrentConfig();
            rs = new RunService($.extend(true, {}, existingOptions, { id: run }));
        } else {
            throw new Error('Invalid run object provided');
        }
        return rs.save(toMark);
    },
    save: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: true, trashed: false });
        return this.mark(run, param);
    },
    remove: function (run, otherFields) {
        var param = $.extend(true, {}, otherFields, { saved: false, trashed: true });
        return this.mark(run, param);
    },
    getRuns: function (variables, filter, options) {
        //TODO: Add group/user scope filters here
        var actingFilter = $.extend(true, {}, {
            saved: true, trashed: false
        }, filter);

        var opModifiers = {
            sort: 'created',
            direction: 'asc'
        };
        var me = this;
        return this.runService.query(actingFilter, opModifiers).then(function (savedRuns) {
            if (!variables || !variables.length) {
                return savedRuns;
            }
            var promises = savedRuns.map(function (run) {
                var prom = me.runService.variables().query([].concat(variables), {}, { filter: run.id }).then(function (variables) {
                    run.variables = variables;
                    return run;
                }).catch(function (err) {
                    if (err) {
                        console.error(err);
                    }
                    run.variables = {};
                    return run;
                });
                return prom;
            });
            return $.when.apply(null, promises).then(function () {
                return Array.apply(null, arguments);
            });
        });
    }
};
module.exports = SavedRunsManager;

},{"../service/run-api-service":36,"../store/session-manager":44}],22:[function(require,module,exports){
'use strict';

var RunManager = require('./run-manager');
var SavedRunsManager = require('./saved-run-manager');

var defaults = {
    baselineRunName: 'Baseline',
};

function ScenarioManager(config) {
    var serviceOptions = $.extend(true, {}, defaults, config);

    this.baseline = new RunManager({
        strategy: 'baseline',
        sessionKey: 'sm-baseline-run',
        run: serviceOptions.run,
    });
    this.current = new RunManager({
        strategy: 'new-if-stepped',
        sessionKey: 'sm-current-run',
        run: serviceOptions.run,
    });

    //TODO: Creating on init to make sure the 'getruns' call sees this, but ajax on constructor sounds unexpected. Maybe do it on 'getRuns' instead?
    var baseLineProm = this.baseline.getRun();

    this.savedRuns = new SavedRunsManager({
        run: serviceOptions.run,
    });

    var orig = this.savedRuns.getRuns;
    this.savedRuns.getRuns = function () {
        var args = Array.apply(null, arguments);
        var me = this;
        return baseLineProm.then(function () {
            return orig.apply(me.savedRuns, args);
        });
    };
}

module.exports = ScenarioManager;

},{"./run-manager":10,"./saved-run-manager":21}],23:[function(require,module,exports){
'use strict';
var classFrom = require('../../util/inherit');

var Base = {};
var BASELINE_NAME = 'baseline';
module.exports = classFrom(Base, {
    constructor: function (runService, options) {
    },

    reset: function (runService, userSession) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());

        return runService.create(opt).then(function (createResponse) {
            return runService.save({
                saved: true,
                trashed: false, //TODO remove this once EPICENTER-2500 is fixed
                name: BASELINE_NAME
            }).then(function (patchResponse) {
                return $.extend(true, {}, createResponse, patchResponse);
            });
        }).then(function (mergedResponse) {
            return runService.do({ stepTo: 'end' }).then(function () {
                return mergedResponse;
            });
        });
    },

    getRun: function (runService, userSession, runIdInSession) {
        var filter = { 
            saved: true, 
            trashed: false, //TODO remove this once EPICENTER-2500 is fixed
            name: BASELINE_NAME,
            'scope.group': userSession.groupName,
        };
        if (userSession.userId) {
            filter['user.id'] = userSession.userId;
        }
        var me = this;
        return runService.filter(filter, { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        }).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            return runs[0];
        });
    }
}, { requiresAuth: true });
},{"../../util/inherit":48}],24:[function(require,module,exports){
'use strict';
var classFrom = require('../../util/inherit');
var StateService = require('../../service/state-api-adapter');

var Base = {};
module.exports = classFrom(Base, {
    constructor: function (options) {
    },

    reset: function (runService, userSession) {
        var group = userSession && userSession.groupName;
        var opt = $.extend({
            scope: { group: group }
        }, runService.getCurrentConfig());
        return runService.create(opt).then(function (createResponse) {
            return runService.save({ trashed: false }).then(function (patchResponse) { //TODO remove this once EPICENTER-2500 is fixed
                return $.extend(true, {}, createResponse, patchResponse);
            });
        });
    },

    getRun: function (runService, userSession) {
        var defaultFilterParams = {
            'scope.group': userSession.groupName
        };
        if (userSession.userId) {
            defaultFilterParams['user.id'] = userSession.userId;
        }
        var filter = $.extend(true, {}, defaultFilterParams, { 
            trashed: false, //TODO change to '!=true' once EPICENTER-2500 is fixed
        }); //Can also filter by time0, but assuming if it's stepped it'll be saved
        var me = this;
        var outputModifiers = { 
            startrecord: 0,
            endrecord: 0,
            sort: 'created', 
            direction: 'desc'
        };
        return runService.filter(filter, outputModifiers).then(function (runs) {
            if (!runs.length) {
                return me.reset(runService, userSession);
            }
            var lastRun = runs[0];
            if (lastRun.saved !== true) {
                return lastRun;
            }

            var basedOnRunid = lastRun.id;
            var sa = new StateService();
            return sa.clone({ runId: basedOnRunid, stopBefore: 'stepTo' }).then(function (response) {
                return runService.load(response.run);
            }).then(function (run) {
                //TODO remove this once EPICENTER-2500 is fixed
                return runService.save({ trashed: false }).then(function (patchResponse) {
                    return $.extend(true, {}, run, patchResponse);
                });
            });
        });
    }
}, { requiresAuth: true });
},{"../../service/state-api-adapter":38,"../../util/inherit":48}],25:[function(require,module,exports){
'use strict';


module.exports = {
    reset: function (params, options, manager) {
        return manager.reset(options);
    }
};

},{}],26:[function(require,module,exports){
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

},{"../service/world-api-adapter":42,"./auth-manager":6,"./run-manager":10}],27:[function(require,module,exports){
/**
 * ## File API Service
 *
 * The File API Service allows you to upload and download files directly onto Epicenter, analogous to using the File Manager UI in Epicenter directly or SFTPing files in. It is based on the Epicenter File API.
 *
 * The Asset API Service (https://forio.com/epicenter/docs/public/api_adapters/generated/asset-api-adapter/) is typically used for all project use cases, and it's unlikely this File Service will be used directly except by Admin tools (e.g. Flow Inspector).
 *
 * Partially implemented.
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
        var upload = uploadBody(fileName, contents);

        return $.extend(true, {}, serviceOptions, options, {
            url: urlConfig.getAPIPath('file') + path,
            data: upload.body,
            contentType: 'multipart/form-data; boundary=' + upload.boundary
        });
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
         * @param  {String} contents Contents to write to file
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
         * @param  {String} contents Contents to write to file
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"./configuration-service":31}],28:[function(require,module,exports){
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"../util/object-util":49,"./configuration-service":31}],29:[function(require,module,exports){
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

},{"../transport/http-transport-factory":47,"./configuration-service":31}],30:[function(require,module,exports){
/**
 * ## Channel Service
 *
 * The Epicenter platform provides a push channel, which allows you to publish and subscribe to messages within a [project](../../../glossary/#projects), [group](../../../glossary/#groups), or [multiplayer world](../../../glossary/#world). There are two main use cases for the channel: event notifications and chat messages.
 *
 * The Channel Service is a building block for this functionality. It creates a publish-subscribe object, allowing you to publish messages, subscribe to messages, or unsubscribe from messages for a given 'topic' on a `$.cometd` transport instance.
 *
 * Typically, you use the [Epicenter Channel Manager](../epicenter-channel-manager/) to create or retrieve channels, then use the Channel Service `subscribe()` and `publish()` methods to listen to or update data. (For additional background on Epicenter's push channel, see the introductory notes on the [Push Channel API](../../../rest_apis/multiplayer/channel/) page.)
 *
 * You'll need to include the `epicenter-multiplayer-dependencies.js` library in addition to the `epicenter.js` library in your project to use the Channel Service. See [Including Epicenter.js](../../#include).
 *
 * To use the Channel Service, instantiate it, then make calls to any of the methods you need.
 *
 *        var cs = new F.service.Channel();
 *        cs.publish('/acme-simulations/supply-chain-game/fall-seminar/run/variables', { price: 50 });
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

},{}],31:[function(require,module,exports){
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


},{"./url-config-service":39}],32:[function(require,module,exports){
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"../util/query-util":51,"./configuration-service":31}],33:[function(require,module,exports){
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

},{"../transport/http-transport-factory":47,"./service-utils":37,"object-assign":2}],34:[function(require,module,exports){
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"./configuration-service":31}],35:[function(require,module,exports){
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"../util/object-util":49,"./configuration-service":31}],36:[function(require,module,exports){
/**
 *
 * ## Run API Service
 *
 * The Run API Service allows you to perform common tasks around creating and updating runs, variables, and data.
 *
 * When building interfaces to show run one at a time (as for standard end users), typically you first instantiate a [Run Manager](../run-manager/) and then access the Run Service that is automatically part of the manager, rather than instantiating the Run Service directly. This is because the Run Manager gives you control over run creation depending on run states.
 *
 * However, many of the Epicenter sample projects use a Run Service, because generally the sample projects are played in one end user session and don't care about run states or [run strategies](../strategies/). The Run API Service is also useful for building an interface for a facilitator, because it makes it easy to list data across multiple runs (using the `filter()` and `query()` methods).
 *
 * To use the Run API Service, instantiate it by passing in:
 *
 * * `account`: Epicenter account id (**Team ID** for team projects, **User ID** for personal projects).
 * * `project`: Epicenter project id.
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
 * Additionally, all API calls take in an "options" object as the last parameter. The options can be used to extend/override the Run API Service defaults listed below.
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

        /**
         * Criteria by which to filter runs. Defaults to empty string.
         * @type {String}
         */
        filter: '',

        /**
         * Convenience alias for filter.
         * @type {String}
         */
        id: '',

        /**
         * Flag determines if `X-AutoRestore: true` header is sent to Epicenter. Defaults to `true`.
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

    var urlConfig = new ConfigService(serviceOptions).get('server');
    if (serviceOptions.account) {
        urlConfig.accountPath = serviceOptions.account;
    }
    if (serviceOptions.project) {
        urlConfig.projectPath = serviceOptions.project;
    }

    urlConfig.filter = ';';
    urlConfig.getFilterURL = function () {
        var url = urlConfig.getAPIPath('run');
        var filter = qutil.toMatrixFormat(serviceOptions.filter);

        if (filter) {
            url += filter + '/';
        }
        return url;
    };

    urlConfig.addAutoRestoreHeader = function (options) {
        var filter = serviceOptions.filter;
        // The semicolon separated filter is used when filter is an object
        var isFilterRunId = filter && $.type(filter) === 'string';
        if (serviceOptions.autoRestore && isFilterRunId) {
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

    var httpOptions = $.extend(true, {}, serviceOptions.transport, {
        url: urlConfig.getFilterURL
    });

    if (serviceOptions.token) {
        httpOptions.headers = {
            Authorization: 'Bearer ' + serviceOptions.token
        };
    }
    var http = new TransportFactory(httpOptions);
    http.splitGet = rutil.splitGetFactory(httpOptions);

    var setFilterOrThrowError = function (options) {
        if (options.id) {
            serviceOptions.filter = options.id;
        }
        if (options.filter) {
            serviceOptions.filter = options.filter;
        }
        if (!serviceOptions.filter) {
            throw new Error('No filter specified to apply operations against');
        }
    };

    var publicAsyncAPI = {
        urlConfig: urlConfig,

        /**
         * Create a new run.
         *
         * NOTE: Typically this is not used! Use `RunManager.getRun()` with a `strategy` of `always-new`, or use `RunManager.reset()`. See [Run Manager](../run-manager/) for more details.
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
            var runApiParams = ['model', 'scope', 'files'];
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
         * @param {Object} qs Query object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Querying for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
         * @param {Object} outputModifier (Optional) Available fields include: `startrecord`, `endrecord`, `sort`, and `direction` (`asc` or `desc`).
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
         */
        query: function (qs, outputModifier, options) {
            serviceOptions.filter = qs; //shouldn't be able to over-ride
            var httpOptions = $.extend(true, {}, serviceOptions, options);
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
         * @param {Object} filter Filter object. Each key can be a property of the run or the name of variable that has been saved in the run (prefaced by `variables.`). Each value can be a literal value, or a comparison operator and value. (See [more on filtering](../../../rest_apis/aggregate_run_api/#filters) allowed in the underlying Run API.) Filtering for variables is available for runs [in memory](../../../run_persistence/#runs-in-memory) and for runs [in the database](../../../run_persistence/#runs-in-memory) if the variables are persisted (e.g. that have been `record`ed in your Julia model).
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
         * Get data for a specific run. This includes standard run data such as the account, model, project, and created and last modified dates. To request specific model variables, pass them as part of the `filters` parameter.
         *
         * Note that if the run is [in memory](../../../run_persistence/#runs-in-memory), any model variables are available; if the run is [in the database](../../../run_persistence/#runs-in-db), only model variables that have been persisted &mdash; that is, `record`ed in your Julia model &mdash; are available.
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
         * Call a method from the model.
         *
         * Depending on the language in which you have written your model, the method may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * The `params` argument is normally an array of arguments to the `operation`. In the special case where `operation` only takes one argument, you are not required to put that argument into an array.
         *
         * Note that you can combine the `operation` and `params` arguments into a single object if you prefer, as in the last example.
         *
         * **Examples**
         *
         *      // method "solve" takes no arguments
         *     rs.do('solve');
         *      // method "echo" takes one argument, a string
         *     rs.do('echo', ['hello']);
         *      // method "echo" takes one argument, a string
         *     rs.do('echo', 'hello');
         *      // method "sumArray" takes one argument, an array
         *     rs.do('sumArray', [[4,2,1]]);
         *      // method "add" takes two arguments, both integers
         *     rs.do({ name:'add', params:[2,4] });
         *
         * **Parameters**
         * @param {String} operation Name of method.
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
         * Call several methods from the model, sequentially.
         *
         * Depending on the language in which you have written your model, the methods may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Examples**
         *
         *      // methods "initialize" and "solve" do not take any arguments
         *     rs.serial(['initialize', 'solve']);
         *      // methods "init" and "reset" take two arguments each
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'reset', params: [2,3] }]);
         *      // method "init" takes two arguments,
         *      // method "runmodel" takes none
         *     rs.serial([  { name: 'init', params: [1,2] },
         *                  { name: 'runmodel', params: [] }]);
         *
         * **Parameters**
         * @param {Array} operations If none of the methods take parameters, pass an array of the method names (strings). If any of the methods do take parameters, pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
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
         * Call several methods from the model, executing them in parallel.
         *
         * Depending on the language in which you have written your model, the methods may need to be exposed (e.g. `export` for a Julia model) in the model file in order to be called through the API. See [Writing your Model](../../../writing_your_model/)).
         *
         * **Example**
         *
         *      // methods "solve" and "reset" do not take any arguments
         *     rs.parallel(['solve', 'reset']);
         *      // methods "add" and "subtract" take two arguments each
         *     rs.parallel([ { name: 'add', params: [1,2] },
         *                   { name: 'subtract', params:[2,3] }]);
         *      // methods "add" and "subtract" take two arguments each
         *     rs.parallel({ add: [1,2], subtract: [2,4] });
         *
         * **Parameters**
         * @param {Array|Object} operations If none of the methods take parameters, pass an array of the method names (as strings). If any of the methods do take parameters, you have two options. You can pass an array of objects, each of which contains a method name and its own (possibly empty) array of parameters. Alternatively, you can pass a single object with the method name and a (possibly empty) array of parameters.
         * @param {*} params Parameters to pass to operations.
         * @param {Object} options (Optional) Overrides for configuration options.
         * @return {Promise}
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
         * @param  {Object} options Options can either be of the form `{ runID: <runid> }` or `{ model: <modelFileName> }`.
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"../util/object-util":49,"../util/query-util":51,"../util/run-util":52,"./configuration-service":31,"./introspection-api-service":34,"./variables-api-service":41}],37:[function(require,module,exports){
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
},{"../store/session-manager":44,"./configuration-service":31,"object-assign":2}],38:[function(require,module,exports){
'use strict';
/**
 * ## State API Adapter
 *
 * The State API Adapter allows you to replay or clone runs. It brings existing, persisted run data from the database back into memory, using the same run id (`replay`) or a new run id (`clone`). Runs must be in memory in order for you to update variables or call operations on them.
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"../util/object-util":49,"./configuration-service":31}],39:[function(require,module,exports){
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
            var PROJECT_APIS = ['run', 'data', 'file'];

            if (api === 'config') {
                // var base = options.isLocalhost() ? '' : 
                return this.protocol + '://' + actingHost + '/epicenter/v1/config';
            }
            var apiPath = this.protocol + '://' + this.host + '/' + this.versionPath + api + '/';

            if ($.inArray(api, PROJECT_APIS) !== -1) {
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

},{"../api-version.json":3}],40:[function(require,module,exports){
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
* The constructor takes an optional options parameter in which you can specify the `account` and `token` if they are not already available in the current context.
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



},{"../store/session-manager":44,"../transport/http-transport-factory":47,"../util/query-util":51,"./configuration-service":31}],41:[function(require,module,exports){
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

},{"../transport/http-transport-factory":47,"../util/run-util":52}],42:[function(require,module,exports){
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

},{"../store/session-manager":44,"../transport/http-transport-factory":47,"../util/object-util":49,"./configuration-service":31}],43:[function(require,module,exports){
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

},{}],44:[function(require,module,exports){
'use strict';

var keyNames = require('../managers/key-names');
var StorageFactory = require('./store-factory');
var optionUtils = require('../util/option-utils');

var EPI_SESSION_KEY = keyNames.EPI_SESSION_KEY;
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

            var sessionDefaults = {
                /**
                 * For projects that require authentication, pass in the user access token (defaults to empty string). If the user is already logged in to Epicenter, the user access token is already set in a cookie and automatically loaded from there. (See [more background on access tokens](../../../project_access/)).
                 * @see [Authentication API Service](../auth-api-service/) for getting tokens.
                 * @type {String}
                 */
                token: session.auth_token,

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
},{"../managers/key-names":9,"../util/option-utils":50,"./store-factory":45}],45:[function(require,module,exports){
/**
    Decides type of store to provide
*/

'use strict';
// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var store = (isNode) ? require('./session-store') : require('./cookie-store');
var store = require('./cookie-store');

module.exports = store;

},{"./cookie-store":43}],46:[function(require,module,exports){
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

},{"../util/query-util":51}],47:[function(require,module,exports){
'use strict';

// var isNode = false; FIXME: Browserify/minifyify has issues with the next link
// var transport = (isNode) ? require('./node-http-transport') : require('./ajax-http-transport');
var transport = require('./ajax-http-transport');
module.exports = transport;

},{"./ajax-http-transport":46}],48:[function(require,module,exports){
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

},{}],49:[function(require,module,exports){
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

},{}],50:[function(require,module,exports){
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

},{"../service/configuration-service":31}],51:[function(require,module,exports){
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



},{}],52:[function(require,module,exports){
/**
 * Utilities for working with the run service
*/
'use strict';
var qutil = require('./query-util');
var MAX_URL_LENGTH = 2048;

module.exports = (function () {
    return {
        /**
         * returns operations of the form `[[op1,op2], [arg1, arg2]]`
         * @param  {Object|Array|String} operations operations to perform
         * @param  {Array} args arguments for operation
         * @return {String}    Matrix-format query parameters
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

},{"./query-util":51}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvQmFzZTY0L2Jhc2U2NC5qcyIsIm5vZGVfbW9kdWxlcy9vYmplY3QtYXNzaWduL2luZGV4LmpzIiwic3JjL2FwaS12ZXJzaW9uLmpzb24iLCJzcmMvYXBwLmpzIiwic3JjL2Vudi1sb2FkLmpzIiwic3JjL21hbmFnZXJzL2F1dGgtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9jaGFubmVsLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci5qcyIsInNyYy9tYW5hZ2Vycy9rZXktbmFtZXMuanMiLCJzcmMvbWFuYWdlcnMvcnVuLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvYWx3YXlzLW5ldy1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9pbmRleC5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9tdWx0aXBsYXllci1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9uZXctaWYtaW5pdGlhbGl6ZWQtc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLW1pc3Npbmctc3RyYXRlZ3kuanMiLCJzcmMvbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMvbmV3LWlmLXBlcnNpc3RlZC1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9ub25lLXN0cmF0ZWd5LmpzIiwic3JjL21hbmFnZXJzL3J1bi1zdHJhdGVnaWVzL3BlcnNpc3RlbnQtc2luZ2xlLXBsYXllci1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9ydW4tc3RyYXRlZ2llcy9yZXVzZS1sYXN0LWluaXRpYWxpemVkLmpzIiwic3JjL21hbmFnZXJzL3NhdmVkLXJ1bi1tYW5hZ2VyLmpzIiwic3JjL21hbmFnZXJzL3NjZW5hcmlvLW1hbmFnZXIuanMiLCJzcmMvbWFuYWdlcnMvc2NlbmFyaW8tc3RyYXRlZ2llcy9iYXNlbGluZS1zdHJhdGVneS5qcyIsInNyYy9tYW5hZ2Vycy9zY2VuYXJpby1zdHJhdGVnaWVzL2xhc3QtdW5zYXZlZC5qcyIsInNyYy9tYW5hZ2Vycy9zcGVjaWFsLW9wZXJhdGlvbnMuanMiLCJzcmMvbWFuYWdlcnMvd29ybGQtbWFuYWdlci5qcyIsInNyYy9zZXJ2aWNlL2FkbWluLWZpbGUtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2Fzc2V0LWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvYXV0aC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2RhdGEtYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9ncm91cC1hcGktc2VydmljZS5qcyIsInNyYy9zZXJ2aWNlL2ludHJvc3BlY3Rpb24tYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9tZW1iZXItYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS9ydW4tYXBpLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS9zZXJ2aWNlLXV0aWxzLmpzIiwic3JjL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXIuanMiLCJzcmMvc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UuanMiLCJzcmMvc2VydmljZS91c2VyLWFwaS1hZGFwdGVyLmpzIiwic3JjL3NlcnZpY2UvdmFyaWFibGVzLWFwaS1zZXJ2aWNlLmpzIiwic3JjL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXIuanMiLCJzcmMvc3RvcmUvY29va2llLXN0b3JlLmpzIiwic3JjL3N0b3JlL3Nlc3Npb24tbWFuYWdlci5qcyIsInNyYy9zdG9yZS9zdG9yZS1mYWN0b3J5LmpzIiwic3JjL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0LmpzIiwic3JjL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5LmpzIiwic3JjL3V0aWwvaW5oZXJpdC5qcyIsInNyYy91dGlsL29iamVjdC11dGlsLmpzIiwic3JjL3V0aWwvb3B0aW9uLXV0aWxzLmpzIiwic3JjL3V0aWwvcXVlcnktdXRpbC5qcyIsInNyYy91dGlsL3J1bi11dGlsLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTs7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNsRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFlBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoS0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4T0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hTQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcElBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JLQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3J2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0dBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIjsoZnVuY3Rpb24gKCkge1xuXG4gIHZhciBvYmplY3QgPSB0eXBlb2YgZXhwb3J0cyAhPSAndW5kZWZpbmVkJyA/IGV4cG9ydHMgOiBzZWxmOyAvLyAjODogd2ViIHdvcmtlcnNcbiAgdmFyIGNoYXJzID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky89JztcblxuICBmdW5jdGlvbiBJbnZhbGlkQ2hhcmFjdGVyRXJyb3IobWVzc2FnZSkge1xuICAgIHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG4gIH1cbiAgSW52YWxpZENoYXJhY3RlckVycm9yLnByb3RvdHlwZSA9IG5ldyBFcnJvcjtcbiAgSW52YWxpZENoYXJhY3RlckVycm9yLnByb3RvdHlwZS5uYW1lID0gJ0ludmFsaWRDaGFyYWN0ZXJFcnJvcic7XG5cbiAgLy8gZW5jb2RlclxuICAvLyBbaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vOTk5MTY2XSBieSBbaHR0cHM6Ly9naXRodWIuY29tL25pZ25hZ11cbiAgb2JqZWN0LmJ0b2EgfHwgKFxuICBvYmplY3QuYnRvYSA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHZhciBzdHIgPSBTdHJpbmcoaW5wdXQpO1xuICAgIGZvciAoXG4gICAgICAvLyBpbml0aWFsaXplIHJlc3VsdCBhbmQgY291bnRlclxuICAgICAgdmFyIGJsb2NrLCBjaGFyQ29kZSwgaWR4ID0gMCwgbWFwID0gY2hhcnMsIG91dHB1dCA9ICcnO1xuICAgICAgLy8gaWYgdGhlIG5leHQgc3RyIGluZGV4IGRvZXMgbm90IGV4aXN0OlxuICAgICAgLy8gICBjaGFuZ2UgdGhlIG1hcHBpbmcgdGFibGUgdG8gXCI9XCJcbiAgICAgIC8vICAgY2hlY2sgaWYgZCBoYXMgbm8gZnJhY3Rpb25hbCBkaWdpdHNcbiAgICAgIHN0ci5jaGFyQXQoaWR4IHwgMCkgfHwgKG1hcCA9ICc9JywgaWR4ICUgMSk7XG4gICAgICAvLyBcIjggLSBpZHggJSAxICogOFwiIGdlbmVyYXRlcyB0aGUgc2VxdWVuY2UgMiwgNCwgNiwgOFxuICAgICAgb3V0cHV0ICs9IG1hcC5jaGFyQXQoNjMgJiBibG9jayA+PiA4IC0gaWR4ICUgMSAqIDgpXG4gICAgKSB7XG4gICAgICBjaGFyQ29kZSA9IHN0ci5jaGFyQ29kZUF0KGlkeCArPSAzLzQpO1xuICAgICAgaWYgKGNoYXJDb2RlID4gMHhGRikge1xuICAgICAgICB0aHJvdyBuZXcgSW52YWxpZENoYXJhY3RlckVycm9yKFwiJ2J0b2EnIGZhaWxlZDogVGhlIHN0cmluZyB0byBiZSBlbmNvZGVkIGNvbnRhaW5zIGNoYXJhY3RlcnMgb3V0c2lkZSBvZiB0aGUgTGF0aW4xIHJhbmdlLlwiKTtcbiAgICAgIH1cbiAgICAgIGJsb2NrID0gYmxvY2sgPDwgOCB8IGNoYXJDb2RlO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0O1xuICB9KTtcblxuICAvLyBkZWNvZGVyXG4gIC8vIFtodHRwczovL2dpc3QuZ2l0aHViLmNvbS8xMDIwMzk2XSBieSBbaHR0cHM6Ly9naXRodWIuY29tL2F0a11cbiAgb2JqZWN0LmF0b2IgfHwgKFxuICBvYmplY3QuYXRvYiA9IGZ1bmN0aW9uIChpbnB1dCkge1xuICAgIHZhciBzdHIgPSBTdHJpbmcoaW5wdXQpLnJlcGxhY2UoLz0rJC8sICcnKTtcbiAgICBpZiAoc3RyLmxlbmd0aCAlIDQgPT0gMSkge1xuICAgICAgdGhyb3cgbmV3IEludmFsaWRDaGFyYWN0ZXJFcnJvcihcIidhdG9iJyBmYWlsZWQ6IFRoZSBzdHJpbmcgdG8gYmUgZGVjb2RlZCBpcyBub3QgY29ycmVjdGx5IGVuY29kZWQuXCIpO1xuICAgIH1cbiAgICBmb3IgKFxuICAgICAgLy8gaW5pdGlhbGl6ZSByZXN1bHQgYW5kIGNvdW50ZXJzXG4gICAgICB2YXIgYmMgPSAwLCBicywgYnVmZmVyLCBpZHggPSAwLCBvdXRwdXQgPSAnJztcbiAgICAgIC8vIGdldCBuZXh0IGNoYXJhY3RlclxuICAgICAgYnVmZmVyID0gc3RyLmNoYXJBdChpZHgrKyk7XG4gICAgICAvLyBjaGFyYWN0ZXIgZm91bmQgaW4gdGFibGU/IGluaXRpYWxpemUgYml0IHN0b3JhZ2UgYW5kIGFkZCBpdHMgYXNjaWkgdmFsdWU7XG4gICAgICB+YnVmZmVyICYmIChicyA9IGJjICUgNCA/IGJzICogNjQgKyBidWZmZXIgOiBidWZmZXIsXG4gICAgICAgIC8vIGFuZCBpZiBub3QgZmlyc3Qgb2YgZWFjaCA0IGNoYXJhY3RlcnMsXG4gICAgICAgIC8vIGNvbnZlcnQgdGhlIGZpcnN0IDggYml0cyB0byBvbmUgYXNjaWkgY2hhcmFjdGVyXG4gICAgICAgIGJjKysgJSA0KSA/IG91dHB1dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKDI1NSAmIGJzID4+ICgtMiAqIGJjICYgNikpIDogMFxuICAgICkge1xuICAgICAgLy8gdHJ5IHRvIGZpbmQgY2hhcmFjdGVyIGluIHRhYmxlICgwLTYzLCBub3QgZm91bmQgPT4gLTEpXG4gICAgICBidWZmZXIgPSBjaGFycy5pbmRleE9mKGJ1ZmZlcik7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXQ7XG4gIH0pO1xuXG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyogZXNsaW50LWRpc2FibGUgbm8tdW51c2VkLXZhcnMgKi9cbnZhciBoYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcHJvcElzRW51bWVyYWJsZSA9IE9iamVjdC5wcm90b3R5cGUucHJvcGVydHlJc0VudW1lcmFibGU7XG5cbmZ1bmN0aW9uIHRvT2JqZWN0KHZhbCkge1xuXHRpZiAodmFsID09PSBudWxsIHx8IHZhbCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0dGhyb3cgbmV3IFR5cGVFcnJvcignT2JqZWN0LmFzc2lnbiBjYW5ub3QgYmUgY2FsbGVkIHdpdGggbnVsbCBvciB1bmRlZmluZWQnKTtcblx0fVxuXG5cdHJldHVybiBPYmplY3QodmFsKTtcbn1cblxuZnVuY3Rpb24gc2hvdWxkVXNlTmF0aXZlKCkge1xuXHR0cnkge1xuXHRcdGlmICghT2JqZWN0LmFzc2lnbikge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIERldGVjdCBidWdneSBwcm9wZXJ0eSBlbnVtZXJhdGlvbiBvcmRlciBpbiBvbGRlciBWOCB2ZXJzaW9ucy5cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTQxMThcblx0XHR2YXIgdGVzdDEgPSBuZXcgU3RyaW5nKCdhYmMnKTsgIC8vIGVzbGludC1kaXNhYmxlLWxpbmVcblx0XHR0ZXN0MVs1XSA9ICdkZSc7XG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKHRlc3QxKVswXSA9PT0gJzUnKSB7XG5cdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0fVxuXG5cdFx0Ly8gaHR0cHM6Ly9idWdzLmNocm9taXVtLm9yZy9wL3Y4L2lzc3Vlcy9kZXRhaWw/aWQ9MzA1NlxuXHRcdHZhciB0ZXN0MiA9IHt9O1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMTA7IGkrKykge1xuXHRcdFx0dGVzdDJbJ18nICsgU3RyaW5nLmZyb21DaGFyQ29kZShpKV0gPSBpO1xuXHRcdH1cblx0XHR2YXIgb3JkZXIyID0gT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXModGVzdDIpLm1hcChmdW5jdGlvbiAobikge1xuXHRcdFx0cmV0dXJuIHRlc3QyW25dO1xuXHRcdH0pO1xuXHRcdGlmIChvcmRlcjIuam9pbignJykgIT09ICcwMTIzNDU2Nzg5Jykge1xuXHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdH1cblxuXHRcdC8vIGh0dHBzOi8vYnVncy5jaHJvbWl1bS5vcmcvcC92OC9pc3N1ZXMvZGV0YWlsP2lkPTMwNTZcblx0XHR2YXIgdGVzdDMgPSB7fTtcblx0XHQnYWJjZGVmZ2hpamtsbW5vcHFyc3QnLnNwbGl0KCcnKS5mb3JFYWNoKGZ1bmN0aW9uIChsZXR0ZXIpIHtcblx0XHRcdHRlc3QzW2xldHRlcl0gPSBsZXR0ZXI7XG5cdFx0fSk7XG5cdFx0aWYgKE9iamVjdC5rZXlzKE9iamVjdC5hc3NpZ24oe30sIHRlc3QzKSkuam9pbignJykgIT09XG5cdFx0XHRcdCdhYmNkZWZnaGlqa2xtbm9wcXJzdCcpIHtcblx0XHRcdHJldHVybiBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gdHJ1ZTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdC8vIFdlIGRvbid0IGV4cGVjdCBhbnkgb2YgdGhlIGFib3ZlIHRvIHRocm93LCBidXQgYmV0dGVyIHRvIGJlIHNhZmUuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gc2hvdWxkVXNlTmF0aXZlKCkgPyBPYmplY3QuYXNzaWduIDogZnVuY3Rpb24gKHRhcmdldCwgc291cmNlKSB7XG5cdHZhciBmcm9tO1xuXHR2YXIgdG8gPSB0b09iamVjdCh0YXJnZXQpO1xuXHR2YXIgc3ltYm9scztcblxuXHRmb3IgKHZhciBzID0gMTsgcyA8IGFyZ3VtZW50cy5sZW5ndGg7IHMrKykge1xuXHRcdGZyb20gPSBPYmplY3QoYXJndW1lbnRzW3NdKTtcblxuXHRcdGZvciAodmFyIGtleSBpbiBmcm9tKSB7XG5cdFx0XHRpZiAoaGFzT3duUHJvcGVydHkuY2FsbChmcm9tLCBrZXkpKSB7XG5cdFx0XHRcdHRvW2tleV0gPSBmcm9tW2tleV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0aWYgKE9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMpIHtcblx0XHRcdHN5bWJvbHMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlTeW1ib2xzKGZyb20pO1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBzeW1ib2xzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdGlmIChwcm9wSXNFbnVtZXJhYmxlLmNhbGwoZnJvbSwgc3ltYm9sc1tpXSkpIHtcblx0XHRcdFx0XHR0b1tzeW1ib2xzW2ldXSA9IGZyb21bc3ltYm9sc1tpXV07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gdG87XG59O1xuIiwibW9kdWxlLmV4cG9ydHM9e1xuICAgIFwidmVyc2lvblwiOiBcInYyXCJcbn1cbiIsIi8qKlxuICogRXBpY2VudGVyIEphdmFzY3JpcHQgbGlicmFyaWVzXG4gKiB2PCU9IHZlcnNpb24gJT5cbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9mb3Jpby9lcGljZW50ZXItanMtbGlic1xuICovXG5cbnZhciBGID0ge1xuICAgIHV0aWw6IHt9LFxuICAgIGZhY3Rvcnk6IHt9LFxuICAgIHRyYW5zcG9ydDoge30sXG4gICAgc3RvcmU6IHt9LFxuICAgIHNlcnZpY2U6IHt9LFxuICAgIG1hbmFnZXI6IHtcbiAgICAgICAgc3RyYXRlZ3k6IHt9XG4gICAgfSxcblxufTtcblxuRi5sb2FkID0gcmVxdWlyZSgnLi9lbnYtbG9hZCcpO1xuXG5pZiAoIWdsb2JhbC5TS0lQX0VOVl9MT0FEKSB7XG4gICAgRi5sb2FkKCk7XG59XG5cbkYudXRpbC5xdWVyeSA9IHJlcXVpcmUoJy4vdXRpbC9xdWVyeS11dGlsJyk7XG5GLnV0aWwucnVuID0gcmVxdWlyZSgnLi91dGlsL3J1bi11dGlsJyk7XG5GLnV0aWwuY2xhc3NGcm9tID0gcmVxdWlyZSgnLi91dGlsL2luaGVyaXQnKTtcblxuRi5mYWN0b3J5LlRyYW5zcG9ydCA9IHJlcXVpcmUoJy4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbkYudHJhbnNwb3J0LkFqYXggPSByZXF1aXJlKCcuL3RyYW5zcG9ydC9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG5cbkYuc2VydmljZS5VUkwgPSByZXF1aXJlKCcuL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG5GLnNlcnZpY2UuQ29uZmlnID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xuRi5zZXJ2aWNlLlJ1biA9IHJlcXVpcmUoJy4vc2VydmljZS9ydW4tYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5GaWxlID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2FkbWluLWZpbGUtc2VydmljZScpO1xuRi5zZXJ2aWNlLlZhcmlhYmxlcyA9IHJlcXVpcmUoJy4vc2VydmljZS92YXJpYWJsZXMtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5EYXRhID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2RhdGEtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5BdXRoID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2F1dGgtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5Xb3JsZCA9IHJlcXVpcmUoJy4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLlN0YXRlID0gcmVxdWlyZSgnLi9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuVXNlciA9IHJlcXVpcmUoJy4vc2VydmljZS91c2VyLWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuTWVtYmVyID0gcmVxdWlyZSgnLi9zZXJ2aWNlL21lbWJlci1hcGktYWRhcHRlcicpO1xuRi5zZXJ2aWNlLkFzc2V0ID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2Fzc2V0LWFwaS1hZGFwdGVyJyk7XG5GLnNlcnZpY2UuR3JvdXAgPSByZXF1aXJlKCcuL3NlcnZpY2UvZ3JvdXAtYXBpLXNlcnZpY2UnKTtcbkYuc2VydmljZS5JbnRyb3NwZWN0ID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2ludHJvc3BlY3Rpb24tYXBpLXNlcnZpY2UnKTtcblxuRi5zdG9yZS5Db29raWUgPSByZXF1aXJlKCcuL3N0b3JlL2Nvb2tpZS1zdG9yZScpO1xuRi5mYWN0b3J5LlN0b3JlID0gcmVxdWlyZSgnLi9zdG9yZS9zdG9yZS1mYWN0b3J5Jyk7XG5cbkYubWFuYWdlci5TY2VuYXJpb01hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3NjZW5hcmlvLW1hbmFnZXInKTtcbkYubWFuYWdlci5SdW5NYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9ydW4tbWFuYWdlcicpO1xuRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9hdXRoLW1hbmFnZXInKTtcbkYubWFuYWdlci5Xb3JsZE1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL3dvcmxkLW1hbmFnZXInKTtcbkYubWFuYWdlci5TYXZlZFJ1bnNNYW5hZ2VyID0gcmVxdWlyZSgnLi9tYW5hZ2Vycy9zYXZlZC1ydW4tbWFuYWdlcicpO1xuXG52YXIgc3RyYXRlZ2llcyA9IHJlcXVpcmUoJy4vbWFuYWdlcnMvcnVuLXN0cmF0ZWdpZXMnKTtcbkYubWFuYWdlci5zdHJhdGVneSA9IHN0cmF0ZWdpZXMubGlzdDsgLy9UT0RPOiB0aGlzIGlzIG5vdCByZWFsbHkgYSBtYW5hZ2VyIHNvIG5hbWVzcGFjZSB0aGlzIGJldHRlclxuXG5GLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIgPSByZXF1aXJlKCcuL21hbmFnZXJzL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXInKTtcbkYuc2VydmljZS5DaGFubmVsID0gcmVxdWlyZSgnLi9zZXJ2aWNlL2NoYW5uZWwtc2VydmljZScpO1xuXG5GLnZlcnNpb24gPSAnPCU9IHZlcnNpb24gJT4nO1xuRi5hcGkgPSByZXF1aXJlKCcuL2FwaS12ZXJzaW9uLmpzb24nKTtcblxuZ2xvYmFsLkYgPSBGO1xubW9kdWxlLmV4cG9ydHMgPSBGO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVVJMQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vc2VydmljZS91cmwtY29uZmlnLXNlcnZpY2UnKTtcblxudmFyIGVudkxvYWQgPSBmdW5jdGlvbiAoY2FsbGJhY2spIHtcbiAgICB2YXIgdXJsU2VydmljZSA9IG5ldyBVUkxDb25maWdTZXJ2aWNlKCk7XG4gICAgdmFyIGluZm9VcmwgPSB1cmxTZXJ2aWNlLmdldEFQSVBhdGgoJ2NvbmZpZycpO1xuICAgIHZhciBlbnZQcm9taXNlID0gJC5hamF4KHsgdXJsOiBpbmZvVXJsLCBhc3luYzogZmFsc2UgfSk7XG4gICAgZW52UHJvbWlzZSA9IGVudlByb21pc2UudGhlbihmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgIHZhciBvdmVycmlkZXMgPSByZXMuYXBpO1xuICAgICAgICBVUkxDb25maWdTZXJ2aWNlLmRlZmF1bHRzID0gJC5leHRlbmQoVVJMQ29uZmlnU2VydmljZS5kZWZhdWx0cywgb3ZlcnJpZGVzKTtcbiAgICB9KTtcbiAgICByZXR1cm4gZW52UHJvbWlzZS50aGVuKGNhbGxiYWNrKS5mYWlsKGNhbGxiYWNrKTtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZW52TG9hZDtcbiIsIi8qKlxuKiAjIyBBdXRob3JpemF0aW9uIE1hbmFnZXJcbipcbiogVGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciBwcm92aWRlcyBhbiBlYXN5IHdheSB0byBtYW5hZ2UgdXNlciBhdXRoZW50aWNhdGlvbiAobG9nZ2luZyBpbiBhbmQgb3V0KSBhbmQgYXV0aG9yaXphdGlvbiAoa2VlcGluZyB0cmFjayBvZiB0b2tlbnMsIHNlc3Npb25zLCBhbmQgZ3JvdXBzKSBmb3IgcHJvamVjdHMuXG4qXG4qIFRoZSBBdXRob3JpemF0aW9uIE1hbmFnZXIgaXMgbW9zdCB1c2VmdWwgZm9yIFt0ZWFtIHByb2plY3RzXSguLi8uLi8uLi9nbG9zc2FyeS8jdGVhbSkgd2l0aCBhbiBhY2Nlc3MgbGV2ZWwgb2YgW0F1dGhlbnRpY2F0ZWRdKC4uLy4uLy4uL2dsb3NzYXJ5LyNhY2Nlc3MpLiBUaGVzZSBwcm9qZWN0cyBhcmUgYWNjZXNzZWQgYnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2Ygb25lIG9yIG1vcmUgW2dyb3Vwc10oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuXG4qXG4qICMjIyMgVXNpbmcgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlclxuKlxuKiBUbyB1c2UgdGhlIEF1dGhvcml6YXRpb24gTWFuYWdlciwgaW5zdGFudGlhdGUgaXQuIFRoZW4sIG1ha2UgY2FsbHMgdG8gYW55IG9mIHRoZSBtZXRob2RzIHlvdSBuZWVkOlxuKlxuKiAgICAgICB2YXIgYXV0aE1nciA9IG5ldyBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdXNlck5hbWU6ICdlbmR1c2VyMScsXG4qICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJ1xuKiAgICAgICB9KTtcbiogICAgICAgYXV0aE1nci5sb2dpbigpLnRoZW4oZnVuY3Rpb24gKCkge1xuKiAgICAgICAgICAgYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4qICAgICAgIH0pO1xuKlxuKlxuKiBUaGUgYG9wdGlvbnNgIG9iamVjdCBwYXNzZWQgdG8gdGhlIGBGLm1hbmFnZXIuQXV0aE1hbmFnZXIoKWAgY2FsbCBjYW4gaW5jbHVkZTpcbipcbiogICAqIGBhY2NvdW50YDogVGhlIGFjY291bnQgaWQgZm9yIHRoaXMgYHVzZXJOYW1lYC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciB0aGUgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4qICAgKiBgdXNlck5hbWVgOiBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uXG4qICAgKiBgcGFzc3dvcmRgOiBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIGB1c2VyTmFtZWAuXG4qICAgKiBgcHJvamVjdGA6IFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhlIHByb2plY3QgdG8gbG9nIHRoaXMgdXNlciBpbnRvLiBPcHRpb25hbC5cbiogICAqIGBncm91cElkYDogSWQgb2YgdGhlIGdyb3VwIHRvIHdoaWNoIGB1c2VyTmFtZWAgYmVsb25ncy4gUmVxdWlyZWQgZm9yIGVuZCB1c2VycyBpZiB0aGUgYHByb2plY3RgIGlzIHNwZWNpZmllZC5cbipcbiogSWYgeW91IHByZWZlciBzdGFydGluZyBmcm9tIGEgdGVtcGxhdGUsIHRoZSBFcGljZW50ZXIgSlMgTGlicyBbTG9naW4gQ29tcG9uZW50XSguLi8uLi8jY29tcG9uZW50cykgdXNlcyB0aGUgQXV0aG9yaXphdGlvbiBNYW5hZ2VyIGFzIHdlbGwuIFRoaXMgc2FtcGxlIEhUTUwgcGFnZSAoYW5kIGFzc29jaWF0ZWQgQ1NTIGFuZCBKUyBmaWxlcykgcHJvdmlkZXMgYSBsb2dpbiBmb3JtIGZvciB0ZWFtIG1lbWJlcnMgYW5kIGVuZCB1c2VycyBvZiB5b3VyIHByb2plY3QuIEl0IGFsc28gaW5jbHVkZXMgYSBncm91cCBzZWxlY3RvciBmb3IgZW5kIHVzZXJzIHRoYXQgYXJlIG1lbWJlcnMgb2YgbXVsdGlwbGUgZ3JvdXBzLlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIEF1dGhBZGFwdGVyID0gcmVxdWlyZSgnLi4vc2VydmljZS9hdXRoLWFwaS1zZXJ2aWNlJyk7XG52YXIgTWVtYmVyQWRhcHRlciA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvbWVtYmVyLWFwaS1hZGFwdGVyJyk7XG52YXIgR3JvdXBTZXJ2aWNlID0gcmVxdWlyZSgnLi4vc2VydmljZS9ncm91cC1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgYXRvYiA9IHdpbmRvdy5hdG9iIHx8IHJlcXVpcmUoJ0Jhc2U2NCcpLmF0b2I7XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICByZXF1aXJlc0dyb3VwOiB0cnVlXG59O1xuXG5mdW5jdGlvbiBBdXRoTWFuYWdlcihvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcihvcHRpb25zKTtcbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoKTtcblxuICAgIHRoaXMuYXV0aEFkYXB0ZXIgPSBuZXcgQXV0aEFkYXB0ZXIodGhpcy5vcHRpb25zKTtcbn1cblxudmFyIF9maW5kVXNlckluR3JvdXAgPSBmdW5jdGlvbiAobWVtYmVycywgaWQpIHtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG1lbWJlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKG1lbWJlcnNbal0udXNlcklkID09PSBpZCkge1xuICAgICAgICAgICAgcmV0dXJuIG1lbWJlcnNbal07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59O1xuXG5BdXRoTWFuYWdlci5wcm90b3R5cGUgPSAkLmV4dGVuZChBdXRoTWFuYWdlci5wcm90b3R5cGUsIHtcblxuICAgIC8qKlxuICAgICogTG9ncyB1c2VyIGluLlxuICAgICpcbiAgICAqICoqRXhhbXBsZSoqXG4gICAgKlxuICAgICogICAgICAgYXV0aE1nci5sb2dpbih7XG4gICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgKiAgICAgICAgICAgdXNlck5hbWU6ICdlbmR1c2VyMScsXG4gICAgKiAgICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCdcbiAgICAqICAgICAgIH0pXG4gICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc3RhdHVzT2JqKSB7XG4gICAgKiAgICAgICAgICAgICAgIC8vIGlmIGVuZHVzZXIxIGJlbG9uZ3MgdG8gZXhhY3RseSBvbmUgZ3JvdXBcbiAgICAqICAgICAgICAgICAgICAgLy8gKG9yIGlmIHRoZSBsb2dpbigpIGNhbGwgaXMgbW9kaWZpZWQgdG8gaW5jbHVkZSB0aGUgZ3JvdXAgaWQpXG4gICAgKiAgICAgICAgICAgICAgIC8vIGNvbnRpbnVlIGhlcmVcbiAgICAqICAgICAgICAgICB9KVxuICAgICogICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKHN0YXR1c09iaikge1xuICAgICogICAgICAgICAgICAgICAvLyBpZiBlbmR1c2VyMSBiZWxvbmdzIHRvIG11bHRpcGxlIGdyb3VwcyxcbiAgICAqICAgICAgICAgICAgICAgLy8gdGhlIGxvZ2luKCkgY2FsbCBmYWlsc1xuICAgICogICAgICAgICAgICAgICAvLyBhbmQgcmV0dXJucyBhbGwgZ3JvdXBzIG9mIHdoaWNoIHRoZSB1c2VyIGlzIGEgbWVtYmVyXG4gICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IHN0YXR1c09iai51c2VyR3JvdXBzLmxlbmd0aDsgaSsrKSB7XG4gICAgKiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhzdGF0dXNPYmoudXNlckdyb3Vwc1tpXS5uYW1lLCBzdGF0dXNPYmoudXNlckdyb3Vwc1tpXS5ncm91cElkKTtcbiAgICAqICAgICAgICAgICAgICAgfVxuICAgICogICAgICAgICAgIH0pO1xuICAgICpcbiAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgKlxuICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy4gSWYgbm90IHBhc3NlZCBpbiB3aGVuIGNyZWF0aW5nIGFuIGluc3RhbmNlIG9mIHRoZSBtYW5hZ2VyIChgRi5tYW5hZ2VyLkF1dGhNYW5hZ2VyKClgKSwgdGhlc2Ugb3B0aW9ucyBzaG91bGQgaW5jbHVkZTpcbiAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLmFjY291bnQgVGhlIGFjY291bnQgaWQgZm9yIHRoaXMgYHVzZXJOYW1lYC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciB0aGUgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy51c2VyTmFtZSBFbWFpbCBvciB1c2VybmFtZSB0byB1c2UgZm9yIGxvZ2dpbmcgaW4uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5wYXNzd29yZCBQYXNzd29yZCBmb3Igc3BlY2lmaWVkIGB1c2VyTmFtZWAuXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5wcm9qZWN0IChPcHRpb25hbCkgVGhlICoqUHJvamVjdCBJRCoqIGZvciB0aGUgcHJvamVjdCB0byBsb2cgdGhpcyB1c2VyIGludG8uXG4gICAgKiBAcGFyYW0ge3N0cmluZ30gb3B0aW9ucy5ncm91cElkIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggYHVzZXJOYW1lYCBiZWxvbmdzLiBSZXF1aXJlZCBmb3IgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSBpZiB0aGUgYHByb2plY3RgIGlzIHNwZWNpZmllZCBhbmQgaWYgdGhlIGVuZCB1c2VycyBhcmUgbWVtYmVycyBvZiBtdWx0aXBsZSBbZ3JvdXBzXSguLi8uLi8uLi9nbG9zc2FyeS8jZ3JvdXBzKSwgb3RoZXJ3aXNlIG9wdGlvbmFsLlxuICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBzZXNzaW9uTWFuYWdlciA9IHRoaXMuc2Vzc2lvbk1hbmFnZXI7XG4gICAgICAgIHZhciBhZGFwdGVyT3B0aW9ucyA9IHNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoeyBzdWNjZXNzOiAkLm5vb3AsIGVycm9yOiAkLm5vb3AgfSwgb3B0aW9ucyk7XG4gICAgICAgIHZhciBvdXRTdWNjZXNzID0gYWRhcHRlck9wdGlvbnMuc3VjY2VzcztcbiAgICAgICAgdmFyIG91dEVycm9yID0gYWRhcHRlck9wdGlvbnMuZXJyb3I7XG4gICAgICAgIHZhciBncm91cElkID0gYWRhcHRlck9wdGlvbnMuZ3JvdXBJZDtcblxuICAgICAgICB2YXIgZGVjb2RlVG9rZW4gPSBmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgICAgICAgIHZhciBlbmNvZGVkID0gdG9rZW4uc3BsaXQoJy4nKVsxXTtcbiAgICAgICAgICAgIHdoaWxlIChlbmNvZGVkLmxlbmd0aCAlIDQgIT09IDApIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICAgICAgZW5jb2RlZCArPSAnPSc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShhdG9iKGVuY29kZWQpKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaGFuZGxlR3JvdXBFcnJvciA9IGZ1bmN0aW9uIChtZXNzYWdlLCBzdGF0dXNDb2RlLCBkYXRhKSB7XG4gICAgICAgICAgICAvLyBsb2dvdXQgdGhlIHVzZXIgc2luY2UgaXQncyBpbiBhbiBpbnZhbGlkIHN0YXRlIHdpdGggbm8gZ3JvdXAgc2VsZWN0ZWRcbiAgICAgICAgICAgIG1lLmxvZ291dCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBlcnJvciA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkYXRhLCB7IHN0YXR1c1RleHQ6IG1lc3NhZ2UsIHN0YXR1czogc3RhdHVzQ29kZSB9KTtcbiAgICAgICAgICAgICAgICAkZC5yZWplY3QoZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGhhbmRsZVN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHZhciB0b2tlbiA9IHJlc3BvbnNlLmFjY2Vzc190b2tlbjtcbiAgICAgICAgICAgIHZhciB1c2VySW5mbyA9IGRlY29kZVRva2VuKHRva2VuKTtcbiAgICAgICAgICAgIHZhciBvbGRHcm91cHMgPSBzZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGFkYXB0ZXJPcHRpb25zKS5ncm91cHMgfHwge307XG4gICAgICAgICAgICB2YXIgdXNlckdyb3VwT3B0cyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBhZGFwdGVyT3B0aW9ucywgeyBzdWNjZXNzOiAkLm5vb3AgfSk7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHsgYXV0aDogcmVzcG9uc2UsIHVzZXI6IHVzZXJJbmZvIH07XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGFkYXB0ZXJPcHRpb25zLnByb2plY3Q7XG4gICAgICAgICAgICB2YXIgaXNUZWFtTWVtYmVyID0gdXNlckluZm8ucGFyZW50X2FjY291bnRfaWQgPT09IG51bGw7XG4gICAgICAgICAgICB2YXIgcmVxdWlyZXNHcm91cCA9IGFkYXB0ZXJPcHRpb25zLnJlcXVpcmVzR3JvdXAgJiYgcHJvamVjdDtcblxuICAgICAgICAgICAgdmFyIHNlc3Npb25JbmZvID0ge1xuICAgICAgICAgICAgICAgIGF1dGhfdG9rZW46IHRva2VuLFxuICAgICAgICAgICAgICAgIGFjY291bnQ6IGFkYXB0ZXJPcHRpb25zLmFjY291bnQsXG4gICAgICAgICAgICAgICAgcHJvamVjdDogcHJvamVjdCxcbiAgICAgICAgICAgICAgICB1c2VySWQ6IHVzZXJJbmZvLnVzZXJfaWQsXG4gICAgICAgICAgICAgICAgZ3JvdXBzOiBvbGRHcm91cHMsXG4gICAgICAgICAgICAgICAgaXNUZWFtTWVtYmVyOiBpc1RlYW1NZW1iZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICAvLyBUaGUgZ3JvdXAgaXMgbm90IHJlcXVpcmVkIGlmIHRoZSB1c2VyIGlzIG5vdCBsb2dnaW5nIGludG8gYSBwcm9qZWN0XG4gICAgICAgICAgICBpZiAoIXJlcXVpcmVzR3JvdXApIHtcbiAgICAgICAgICAgICAgICBzZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uSW5mbyk7XG4gICAgICAgICAgICAgICAgb3V0U3VjY2Vzcy5hcHBseSh0aGlzLCBbZGF0YV0pO1xuICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaGFuZGxlR3JvdXBMaXN0ID0gZnVuY3Rpb24gKGdyb3VwTGlzdCkge1xuICAgICAgICAgICAgICAgIGRhdGEudXNlckdyb3VwcyA9IGdyb3VwTGlzdDtcblxuICAgICAgICAgICAgICAgIHZhciBncm91cCA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGdyb3VwTGlzdC5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBFcnJvcignVGhlIHVzZXIgaGFzIG5vIGdyb3VwcyBhc3NvY2lhdGVkIGluIHRoaXMgYWNjb3VudCcsIDQwMSwgZGF0YSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGdyb3VwTGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gU2VsZWN0IHRoZSBvbmx5IGdyb3VwXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwID0gZ3JvdXBMaXN0WzBdO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoZ3JvdXBMaXN0Lmxlbmd0aCA+IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGdyb3VwSWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaWx0ZXJlZEdyb3VwcyA9ICQuZ3JlcChncm91cExpc3QsIGZ1bmN0aW9uIChyZXNHcm91cCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNHcm91cC5ncm91cElkID09PSBncm91cElkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cCA9IGZpbHRlcmVkR3JvdXBzLmxlbmd0aCA9PT0gMSA/IGZpbHRlcmVkR3JvdXBzWzBdIDogbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChncm91cCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBBIHRlYW0gbWVtYmVyIGRvZXMgbm90IGdldCB0aGUgZ3JvdXAgbWVtYmVycyBiZWNhdXNlIGlzIGNhbGxpbmcgdGhlIEdyb3VwIEFQSVxuICAgICAgICAgICAgICAgICAgICAvLyBidXQgaXQncyBhdXRvbWF0aWNhbGx5IGEgZmFjIHVzZXJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGlzRmFjID0gaXNUZWFtTWVtYmVyID8gdHJ1ZSA6IF9maW5kVXNlckluR3JvdXAoZ3JvdXAubWVtYmVycywgdXNlckluZm8udXNlcl9pZCkucm9sZSA9PT0gJ2ZhY2lsaXRhdG9yJztcbiAgICAgICAgICAgICAgICAgICAgdmFyIGdyb3VwRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwSWQ6IGdyb3VwLmdyb3VwSWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBncm91cE5hbWU6IGdyb3VwLm5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICBpc0ZhYzogaXNGYWNcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlc3Npb25JbmZvV2l0aEdyb3VwID0gb2JqZWN0QXNzaWduKHt9LCBzZXNzaW9uSW5mbywgZ3JvdXBEYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgc2Vzc2lvbkluZm8uZ3JvdXBzW3Byb2plY3RdID0gZ3JvdXBEYXRhO1xuICAgICAgICAgICAgICAgICAgICBtZS5zZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uSW5mb1dpdGhHcm91cCwgYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgICAgICBvdXRTdWNjZXNzLmFwcGx5KHRoaXMsIFtkYXRhXSk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUoZGF0YSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlR3JvdXBFcnJvcignVGhpcyB1c2VyIGlzIGFzc29jaWF0ZWQgd2l0aCBtb3JlIHRoYW4gb25lIGdyb3VwLiBQbGVhc2Ugc3BlY2lmeSBhIGdyb3VwIGlkIHRvIGxvZyBpbnRvIGFuZCB0cnkgYWdhaW4nLCA0MDMsIGRhdGEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICghaXNUZWFtTWVtYmVyKSB7XG4gICAgICAgICAgICAgICAgbWUuZ2V0VXNlckdyb3Vwcyh7IHVzZXJJZDogdXNlckluZm8udXNlcl9pZCwgdG9rZW46IHRva2VuIH0sIHVzZXJHcm91cE9wdHMpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGhhbmRsZUdyb3VwTGlzdCwgJGQucmVqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdHMgPSBvYmplY3RBc3NpZ24oe30sIHVzZXJHcm91cE9wdHMsIHsgdG9rZW46IHRva2VuIH0pO1xuICAgICAgICAgICAgICAgIHZhciBncm91cFNlcnZpY2UgPSBuZXcgR3JvdXBTZXJ2aWNlKG9wdHMpO1xuICAgICAgICAgICAgICAgIGdyb3VwU2VydmljZS5nZXRHcm91cHMoeyBhY2NvdW50OiBhZGFwdGVyT3B0aW9ucy5hY2NvdW50LCBwcm9qZWN0OiBwcm9qZWN0IH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEdyb3VwIEFQSSByZXR1cm5zIGlkIGluc3RlYWQgb2YgZ3JvdXBJZFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXBzLmZvckVhY2goZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZ3JvdXAuZ3JvdXBJZCA9IGdyb3VwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVHcm91cExpc3QoZ3JvdXBzKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgJGQucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBhZGFwdGVyT3B0aW9ucy5zdWNjZXNzID0gaGFuZGxlU3VjY2VzcztcbiAgICAgICAgYWRhcHRlck9wdGlvbnMuZXJyb3IgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgIGlmIChhZGFwdGVyT3B0aW9ucy5hY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVHJ5IHRvIGxvZ2luIGFzIGEgc3lzdGVtIHVzZXJcbiAgICAgICAgICAgICAgICBhZGFwdGVyT3B0aW9ucy5hY2NvdW50ID0gbnVsbDtcbiAgICAgICAgICAgICAgICBhZGFwdGVyT3B0aW9ucy5lcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgb3V0RXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgbWUuYXV0aEFkYXB0ZXIubG9naW4oYWRhcHRlck9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgb3V0RXJyb3IuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICRkLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hdXRoQWRhcHRlci5sb2dpbihhZGFwdGVyT3B0aW9ucyk7XG4gICAgICAgIHJldHVybiAkZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICogTG9ncyB1c2VyIG91dCBieSBjbGVhcmluZyBhbGwgc2Vzc2lvbiBpbmZvcm1hdGlvbi5cbiAgICAqXG4gICAgKiAqKkV4YW1wbGUqKlxuICAgICpcbiAgICAqICAgICAgIGF1dGhNZ3IubG9nb3V0KCk7XG4gICAgKlxuICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAqXG4gICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAqL1xuICAgIGxvZ291dDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKG9wdGlvbnMpO1xuXG4gICAgICAgIHZhciByZW1vdmVDb29raWVGbiA9IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgbWUuc2Vzc2lvbk1hbmFnZXIucmVtb3ZlU2Vzc2lvbigpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiB0aGlzLmF1dGhBZGFwdGVyLmxvZ291dChhZGFwdGVyT3B0aW9ucykudGhlbihyZW1vdmVDb29raWVGbik7XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJldHVybnMgdGhlIGV4aXN0aW5nIHVzZXIgYWNjZXNzIHRva2VuIGlmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluLiBPdGhlcndpc2UsIGxvZ3MgdGhlIHVzZXIgaW4sIGNyZWF0aW5nIGEgbmV3IHVzZXIgYWNjZXNzIHRva2VuLCBhbmQgcmV0dXJucyB0aGUgbmV3IHRva2VuLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBhdXRoTWdyLmdldFRva2VuKClcbiAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbiAodG9rZW4pIHtcbiAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coJ015IHRva2VuIGlzICcsIHRva2VuKTtcbiAgICAgKiAgICAgICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIGdldFRva2VuOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMob3B0aW9ucyk7XG5cbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldFNlc3Npb24oaHR0cE9wdGlvbnMpO1xuICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIGlmIChzZXNzaW9uLmF1dGhfdG9rZW4pIHtcbiAgICAgICAgICAgICRkLnJlc29sdmUoc2Vzc2lvbi5hdXRoX3Rva2VuKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMubG9naW4oaHR0cE9wdGlvbnMpLnRoZW4oJGQucmVzb2x2ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUmV0dXJucyBhbiBhcnJheSBvZiBncm91cCByZWNvcmRzLCBvbmUgZm9yIGVhY2ggZ3JvdXAgb2Ygd2hpY2ggdGhlIGN1cnJlbnQgdXNlciBpcyBhIG1lbWJlci4gRWFjaCBncm91cCByZWNvcmQgaW5jbHVkZXMgdGhlIGdyb3VwIGBuYW1lYCwgYGFjY291bnRgLCBgcHJvamVjdGAsIGFuZCBgZ3JvdXBJZGAuXG4gICAgICpcbiAgICAgKiBJZiBzb21lIGVuZCB1c2VycyBpbiB5b3VyIHByb2plY3QgYXJlIG1lbWJlcnMgb2YgbXVsdGlwbGUgZ3JvdXBzLCB0aGlzIGlzIGEgdXNlZnVsIG1ldGhvZCB0byBjYWxsIG9uIHlvdXIgcHJvamVjdCdzIGxvZ2luIHBhZ2UuIFdoZW4gdGhlIHVzZXIgYXR0ZW1wdHMgdG8gbG9nIGluLCB5b3UgY2FuIHVzZSB0aGlzIHRvIGRpc3BsYXkgdGhlIGdyb3VwcyBvZiB3aGljaCB0aGUgdXNlciBpcyBtZW1iZXIsIGFuZCBoYXZlIHRoZSB1c2VyIHNlbGVjdCB0aGUgY29ycmVjdCBncm91cCB0byBsb2cgaW4gdG8gZm9yIHRoaXMgc2Vzc2lvbi5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIC8vIGdldCBncm91cHMgZm9yIGN1cnJlbnQgdXNlclxuICAgICAqICAgICAgdmFyIHNlc3Npb25PYmogPSBhdXRoTWdyLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgKiAgICAgIGF1dGhNZ3IuZ2V0VXNlckdyb3Vwcyh7IHVzZXJJZDogc2Vzc2lvbk9iai51c2VySWQsIHRva2VuOiBzZXNzaW9uT2JqLmF1dGhfdG9rZW4gfSlcbiAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbiAoZ3JvdXBzKSB7XG4gICAgICogICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaSA8IGdyb3Vwcy5sZW5ndGg7IGkrKylcbiAgICAgKiAgICAgICAgICAgICAgICAgIHsgY29uc29sZS5sb2coZ3JvdXBzW2ldLm5hbWUpOyB9XG4gICAgICogICAgICAgICAgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIGdldCBncm91cHMgZm9yIHBhcnRpY3VsYXIgdXNlclxuICAgICAqICAgICAgYXV0aE1nci5nZXRVc2VyR3JvdXBzKHt1c2VySWQ6ICdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCB0b2tlbjogc2F2ZWRQcm9qQWNjZXNzVG9rZW4gfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgT2JqZWN0IHdpdGggYSB1c2VySWQgYW5kIHRva2VuIHByb3BlcnRpZXMuXG4gICAgICogQHBhcmFtIHtTdHJpbmd9IHBhcmFtcy51c2VySWQgVGhlIHVzZXJJZC4gSWYgbG9va2luZyB1cCBncm91cHMgZm9yIHRoZSBjdXJyZW50bHkgbG9nZ2VkIGluIHVzZXIsIHRoaXMgaXMgaW4gdGhlIHNlc3Npb24gaW5mb3JtYXRpb24uIE90aGVyd2lzZSwgcGFzcyBhIHN0cmluZy5cbiAgICAgKiBAcGFyYW0ge1N0cmluZ30gcGFyYW1zLnRva2VuIFRoZSBhdXRob3JpemF0aW9uIGNyZWRlbnRpYWxzIChhY2Nlc3MgdG9rZW4pIHRvIHVzZSBmb3IgY2hlY2tpbmcgdGhlIGdyb3VwcyBmb3IgdGhpcyB1c2VyLiBJZiBsb29raW5nIHVwIGdyb3VwcyBmb3IgdGhlIGN1cnJlbnRseSBsb2dnZWQgaW4gdXNlciwgdGhpcyBpcyBpbiB0aGUgc2Vzc2lvbiBpbmZvcm1hdGlvbi4gQSB0ZWFtIG1lbWJlcidzIHRva2VuIG9yIGEgcHJvamVjdCBhY2Nlc3MgdG9rZW4gY2FuIGFjY2VzcyBhbGwgdGhlIGdyb3VwcyBmb3IgYWxsIGVuZCB1c2VycyBpbiB0aGUgdGVhbSBvciBwcm9qZWN0LlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgKi9cbiAgICBnZXRVc2VyR3JvdXBzOiBmdW5jdGlvbiAocGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBhZGFwdGVyT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh7IHN1Y2Nlc3M6ICQubm9vcCB9LCBvcHRpb25zKTtcbiAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgb3V0U3VjY2VzcyA9IGFkYXB0ZXJPcHRpb25zLnN1Y2Nlc3M7XG5cbiAgICAgICAgYWRhcHRlck9wdGlvbnMuc3VjY2VzcyA9IGZ1bmN0aW9uIChtZW1iZXJJbmZvKSB7XG4gICAgICAgICAgICAvLyBUaGUgbWVtYmVyIEFQSSBpcyBhdCB0aGUgYWNjb3VudCBzY29wZSwgd2UgZmlsdGVyIGJ5IHByb2plY3RcbiAgICAgICAgICAgIGlmIChhZGFwdGVyT3B0aW9ucy5wcm9qZWN0KSB7XG4gICAgICAgICAgICAgICAgbWVtYmVySW5mbyA9ICQuZ3JlcChtZW1iZXJJbmZvLCBmdW5jdGlvbiAoZ3JvdXApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdyb3VwLnByb2plY3QgPT09IGFkYXB0ZXJPcHRpb25zLnByb2plY3Q7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG91dFN1Y2Nlc3MuYXBwbHkodGhpcywgW21lbWJlckluZm9dKTtcbiAgICAgICAgICAgICRkLnJlc29sdmUobWVtYmVySW5mbyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG1lbWJlckFkYXB0ZXIgPSBuZXcgTWVtYmVyQWRhcHRlcih7IHRva2VuOiBwYXJhbXMudG9rZW4sIHNlcnZlcjogYWRhcHRlck9wdGlvbnMuc2VydmVyIH0pO1xuICAgICAgICBtZW1iZXJBZGFwdGVyLmdldEdyb3Vwc0ZvclVzZXIocGFyYW1zLCBhZGFwdGVyT3B0aW9ucykuZmFpbCgkZC5yZWplY3QpO1xuICAgICAgICByZXR1cm4gJGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHNlc3Npb24gaW5mb3JtYXRpb24gZm9yIHRoZSBjdXJyZW50IHVzZXIsIGluY2x1ZGluZyB0aGUgYHVzZXJJZGAsIGBhY2NvdW50YCwgYHByb2plY3RgLCBgZ3JvdXBJZGAsIGBncm91cE5hbWVgLCBgaXNGYWNgICh3aGV0aGVyIHRoZSBlbmQgdXNlciBpcyBhIGZhY2lsaXRhdG9yIG9mIHRoaXMgZ3JvdXApLCBhbmQgYGF1dGhfdG9rZW5gICh1c2VyIGFjY2VzcyB0b2tlbikuXG4gICAgICpcbiAgICAgKiAqSW1wb3J0YW50KjogVGhpcyBtZXRob2QgaXMgc3luY2hyb25vdXMuIFRoZSBzZXNzaW9uIGluZm9ybWF0aW9uIGlzIHJldHVybmVkIGltbWVkaWF0ZWx5IGluIGFuIG9iamVjdDsgbm8gY2FsbGJhY2tzIG9yIHByb21pc2VzIGFyZSBuZWVkZWQuXG4gICAgICpcbiAgICAgKiBTZXNzaW9uIGluZm9ybWF0aW9uIGlzIHN0b3JlZCBpbiBhIGNvb2tpZSBpbiB0aGUgYnJvd3Nlci5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHZhciBzZXNzaW9uT2JqID0gYXV0aE1nci5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAgICovXG4gICAgZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbzogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGFkYXB0ZXJPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHsgc3VjY2VzczogJC5ub29wIH0sIG9wdGlvbnMpO1xuICAgICAgICByZXR1cm4gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKGFkYXB0ZXJPcHRpb25zKTtcbiAgICB9LFxuXG4gICAgLypcbiAgICAgKiBBZGRzIG9uZSBvciBtb3JlIGdyb3VwcyB0byB0aGUgY3VycmVudCBzZXNzaW9uLiBcbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGFzc3VtZXMgdGhhdCB0aGUgcHJvamVjdCBhbmQgZ3JvdXAgZXhpc3QgYW5kIHRoZSB1c2VyIHNwZWNpZmllZCBpbiB0aGUgc2Vzc2lvbiBpcyBwYXJ0IG9mIHRoaXMgcHJvamVjdCBhbmQgZ3JvdXAuXG4gICAgICpcbiAgICAgKiBSZXR1cm5zIHRoZSBuZXcgc2Vzc2lvbiBvYmplY3QuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBhdXRoTWdyLmFkZEdyb3Vwcyh7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJ2dyb3VwTmFtZScsIGdyb3VwSWQ6ICdncm91cElkJyB9KTtcbiAgICAgKiAgICAgIGF1dGhNZ3IuYWRkR3JvdXBzKFt7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJ2dyb3VwTmFtZScsIGdyb3VwSWQ6ICdncm91cElkJyB9LCB7IHByb2plY3Q6ICdoZWxsby13b3JsZCcsIGdyb3VwTmFtZTogJy4uLicgfV0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0ge29iamVjdHxhcnJheX0gZ3JvdXBzIChSZXF1aXJlZCkgVGhlIGdyb3VwIG9iamVjdCBtdXN0IGNvbnRhaW4gdGhlIGBwcm9qZWN0YCAoKipQcm9qZWN0IElEKiopIGFuZCBgZ3JvdXBOYW1lYCBwcm9wZXJ0aWVzLiBJZiBwYXNzaW5nIGFuIGFycmF5IG9mIHN1Y2ggb2JqZWN0cywgYWxsIG9mIHRoZSBvYmplY3RzIG11c3QgY29udGFpbiAqZGlmZmVyZW50KiBgcHJvamVjdGAgKCoqUHJvamVjdCBJRCoqKSB2YWx1ZXM6IGFsdGhvdWdoIGVuZCB1c2VycyBtYXkgYmUgbG9nZ2VkIGluIHRvIG11bHRpcGxlIHByb2plY3RzIGF0IG9uY2UsIHRoZXkgbWF5IG9ubHkgYmUgbG9nZ2VkIGluIHRvIG9uZSBncm91cCBwZXIgcHJvamVjdCBhdCBhIHRpbWUuXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwLmlzRmFjIChvcHRpb25hbCkgRGVmYXVsdHMgdG8gYGZhbHNlYC4gU2V0IHRvIGB0cnVlYCBpZiB0aGUgdXNlciBpbiB0aGUgc2Vzc2lvbiBzaG91bGQgYmUgYSBmYWNpbGl0YXRvciBpbiB0aGlzIGdyb3VwLlxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBncm91cC5ncm91cElkIChvcHRpb25hbCkgRGVmYXVsdHMgdG8gdW5kZWZpbmVkLiBOZWVkZWQgbW9zdGx5IGZvciB0aGUgTWVtYmVycyBBUEkuXG4gICAgICogQHJldHVybiB7T2JqZWN0fSBzZXNzaW9uIGluZm9ybWF0aW9uXG4gICAgKi9cbiAgICBhZGRHcm91cHM6IGZ1bmN0aW9uIChncm91cHMpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLmdldEN1cnJlbnRVc2VyU2Vzc2lvbkluZm8oKTtcbiAgICAgICAgdmFyIGlzQXJyYXkgPSBBcnJheS5pc0FycmF5KGdyb3Vwcyk7XG4gICAgICAgIGdyb3VwcyA9IGlzQXJyYXkgPyBncm91cHMgOiBbZ3JvdXBzXTtcblxuICAgICAgICAkLmVhY2goZ3JvdXBzLCBmdW5jdGlvbiAoaW5kZXgsIGdyb3VwKSB7XG4gICAgICAgICAgICB2YXIgZXh0ZW5kZWRHcm91cCA9ICQuZXh0ZW5kKHt9LCB7IGlzRmFjOiBmYWxzZSB9LCBncm91cCk7XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGV4dGVuZGVkR3JvdXAucHJvamVjdDtcbiAgICAgICAgICAgIHZhciB2YWxpZFByb3BzID0gWydncm91cE5hbWUnLCAnZ3JvdXBJZCcsICdpc0ZhYyddO1xuICAgICAgICAgICAgaWYgKCFwcm9qZWN0IHx8ICFleHRlbmRlZEdyb3VwLmdyb3VwTmFtZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcHJvamVjdCBvciBncm91cE5hbWUgc3BlY2lmaWVkLicpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gZmlsdGVyIG9iamVjdFxuICAgICAgICAgICAgZXh0ZW5kZWRHcm91cCA9IF9waWNrKGV4dGVuZGVkR3JvdXAsIHZhbGlkUHJvcHMpO1xuICAgICAgICAgICAgc2Vzc2lvbi5ncm91cHNbcHJvamVjdF0gPSBleHRlbmRlZEdyb3VwO1xuICAgICAgICB9KTtcbiAgICAgICAgdGhpcy5zZXNzaW9uTWFuYWdlci5zYXZlU2Vzc2lvbihzZXNzaW9uKTtcbiAgICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQXV0aE1hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuICogIyMgQ2hhbm5lbCBNYW5hZ2VyXG4gKlxuICogVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogVGhlIENoYW5uZWwgTWFuYWdlciBpcyBhIHdyYXBwZXIgYXJvdW5kIHRoZSBkZWZhdWx0IFtjb21ldGQgSmF2YVNjcmlwdCBsaWJyYXJ5XShodHRwOi8vZG9jcy5jb21ldGQub3JnLzIvcmVmZXJlbmNlL2phdmFzY3JpcHQuaHRtbCksIGAkLmNvbWV0ZGAuIEl0IHByb3ZpZGVzIGEgZmV3IG5pY2UgZmVhdHVyZXMgdGhhdCBgJC5jb21ldGRgIGRvZXNuJ3QsIGluY2x1ZGluZzpcbiAqXG4gKiAqIEF1dG9tYXRpYyByZS1zdWJzY3JpcHRpb24gdG8gY2hhbm5lbHMgaWYgeW91IGxvc2UgeW91ciBjb25uZWN0aW9uXG4gKiAqIE9ubGluZSAvIE9mZmxpbmUgbm90aWZpY2F0aW9uc1xuICogKiAnRXZlbnRzJyBmb3IgY29tZXRkIG5vdGlmaWNhdGlvbnMgKGluc3RlYWQgb2YgaGF2aW5nIHRvIGxpc3RlbiBvbiBzcGVjaWZpYyBtZXRhIGNoYW5uZWxzKVxuICpcbiAqIFdoaWxlIHlvdSBjYW4gd29yayBkaXJlY3RseSB3aXRoIHRoZSBDaGFubmVsIE1hbmFnZXIgdGhyb3VnaCBOb2RlLmpzIChmb3IgZXhhbXBsZSwgYHJlcXVpcmUoJ21hbmFnZXIvY2hhbm5lbC1tYW5hZ2VyJylgKSAtLSBvciBldmVuIHdvcmsgZGlyZWN0bHkgd2l0aCBgJC5jb21ldGRgIGFuZCBFcGljZW50ZXIncyB1bmRlcmx5aW5nIFtQdXNoIENoYW5uZWwgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8pIC0tIG1vc3Qgb2Z0ZW4gaXQgd2lsbCBiZSBlYXNpZXN0IHRvIHdvcmsgd2l0aCB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKS4gVGhlIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaXMgYSB3cmFwcGVyIHRoYXQgaW5zdGFudGlhdGVzIGEgQ2hhbm5lbCBNYW5hZ2VyIHdpdGggRXBpY2VudGVyLXNwZWNpZmljIGRlZmF1bHRzLlxuICpcbiAqIFlvdSdsbCBuZWVkIHRvIGluY2x1ZGUgdGhlIGBlcGljZW50ZXItbXVsdGlwbGF5ZXItZGVwZW5kZW5jaWVzLmpzYCBsaWJyYXJ5IGluIGFkZGl0aW9uIHRvIHRoZSBgZXBpY2VudGVyLmpzYCBsaWJyYXJ5IGluIHlvdXIgcHJvamVjdCB0byB1c2UgdGhlIENoYW5uZWwgTWFuYWdlci4gKFNlZSBbSW5jbHVkaW5nIEVwaWNlbnRlci5qc10oLi4vLi4vI2luY2x1ZGUpLilcbiAqXG4gKiBUbyB1c2UgdGhlIENoYW5uZWwgTWFuYWdlciBpbiBjbGllbnQtc2lkZSBKYXZhU2NyaXB0LCBpbnN0YW50aWF0ZSB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSwgZ2V0IHRoZSBjaGFubmVsLCB0aGVuIHVzZSB0aGUgY2hhbm5lbCdzIGBzdWJzY3JpYmUoKWAgYW5kIGBwdWJsaXNoKClgIG1ldGhvZHMgdG8gc3Vic2NyaWJlIHRvIHRvcGljcyBvciBwdWJsaXNoIGRhdGEgdG8gdG9waWNzLlxuICpcbiAqICAgICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gKiAgICAgICAgdmFyIGNoYW5uZWwgPSBjbS5nZXRDaGFubmVsKCk7XG4gKlxuICogICAgICAgIGNoYW5uZWwuc3Vic2NyaWJlKCd0b3BpYycsIGNhbGxiYWNrKTtcbiAqICAgICAgICBjaGFubmVsLnB1Ymxpc2goJ3RvcGljJywgeyBteURhdGE6IDEwMCB9KTtcbiAqXG4gKiBUaGUgcGFyYW1ldGVycyBmb3IgaW5zdGFudGlhdGluZyBhIENoYW5uZWwgTWFuYWdlciBpbmNsdWRlOlxuICpcbiAqICogYG9wdGlvbnNgIFRoZSBvcHRpb25zIG9iamVjdCB0byBjb25maWd1cmUgdGhlIENoYW5uZWwgTWFuYWdlci4gQmVzaWRlcyB0aGUgY29tbW9uIG9wdGlvbnMgbGlzdGVkIGhlcmUsIHNlZSBodHRwOi8vZG9jcy5jb21ldGQub3JnL3JlZmVyZW5jZS9qYXZhc2NyaXB0Lmh0bWwgZm9yIG90aGVyIHN1cHBvcnRlZCBvcHRpb25zLlxuICogKiBgb3B0aW9ucy51cmxgIFRoZSBDb21ldGQgZW5kcG9pbnQgVVJMLlxuICogKiBgb3B0aW9ucy53ZWJzb2NrZXRFbmFibGVkYCBXaGV0aGVyIHdlYnNvY2tldCBzdXBwb3J0IGlzIGFjdGl2ZSAoYm9vbGVhbikuXG4gKiAqIGBvcHRpb25zLmNoYW5uZWxgIE90aGVyIGRlZmF1bHRzIHRvIHBhc3Mgb24gdG8gaW5zdGFuY2VzIG9mIHRoZSB1bmRlcmx5aW5nIENoYW5uZWwgU2VydmljZS4gU2VlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pIGZvciBkZXRhaWxzLlxuICpcbiAqL1xuXG52YXIgQ2hhbm5lbCA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvY2hhbm5lbC1zZXJ2aWNlJyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxudmFyIENoYW5uZWxNYW5hZ2VyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBpZiAoISQuY29tZXRkKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignQ29tZXRkIGxpYnJhcnkgbm90IGZvdW5kLiBQbGVhc2UgaW5jbHVkZSBlcGljZW50ZXItbXVsdGlwbGF5ZXItZGVwZW5kZW5jaWVzLmpzJyk7XG4gICAgfVxuICAgIGlmICghb3B0aW9ucyB8fCAhb3B0aW9ucy51cmwpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhbiB1cmwgZm9yIHRoZSBjb21ldGQgc2VydmVyJyk7XG4gICAgfVxuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIENvbWV0ZCBlbmRwb2ludCBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1cmw6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgbG9nIGxldmVsIGZvciB0aGUgY2hhbm5lbCAobG9ncyB0byBjb25zb2xlKS5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGxvZ0xldmVsOiAnaW5mbycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFdoZXRoZXIgd2Vic29ja2V0IHN1cHBvcnQgaXMgYWN0aXZlLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgd2Vic29ja2V0RW5hYmxlZDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogV2hldGhlciB0aGUgQUNLIGV4dGVuc2lvbiBpcyBlbmFibGVkLiBTZWUgaHR0cHM6Ly9kb2NzLmNvbWV0ZC5vcmcvY3VycmVudC9yZWZlcmVuY2UvI19leHRlbnNpb25zX2Fja25vd2xlZGdlIGZvciBtb3JlIGluZm8uXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgYWNrRW5hYmxlZDogdHJ1ZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogSWYgZmFsc2UgZWFjaCBpbnN0YW5jZSBvZiBDaGFubmVsIHdpbGwgaGF2ZSBhIHNlcGFyYXRlIGNvbWV0ZCBjb25uZWN0aW9uIHRvIHNlcnZlciwgd2hpY2ggY291bGQgYmUgbm9pc3kuIFNldCB0byB0cnVlIHRvIHJlLXVzZSB0aGUgc2FtZSBjb25uZWN0aW9uIGFjcm9zcyBpbnN0YW5jZXMuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgc2hhcmVDb25uZWN0aW9uOiBmYWxzZSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3RoZXIgZGVmYXVsdHMgdG8gcGFzcyBvbiB0byBpbnN0YW5jZXMgb2YgdGhlIHVuZGVybHlpbmcgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLyksIHdoaWNoIGFyZSBjcmVhdGVkIHRocm91Z2ggYGdldENoYW5uZWwoKWAuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICBjaGFubmVsOiB7XG5cbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogT3B0aW9ucyB0byBwYXNzIHRvIHRoZSBjaGFubmVsIGhhbmRzaGFrZS5cbiAgICAgICAgICpcbiAgICAgICAgICogRm9yIGV4YW1wbGUsIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIHBhc3NlcyBgZXh0YCBhbmQgYXV0aG9yaXphdGlvbiBpbmZvcm1hdGlvbi4gTW9yZSBpbmZvcm1hdGlvbiBvbiBwb3NzaWJsZSBvcHRpb25zIGlzIGluIHRoZSBkZXRhaWxzIG9mIHRoZSB1bmRlcmx5aW5nIFtQdXNoIENoYW5uZWwgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8pLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgaGFuZHNoYWtlOiB1bmRlZmluZWRcbiAgICB9O1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgZGVmYXVsdENvbWV0T3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucyA9IFtdO1xuICAgIHRoaXMub3B0aW9ucyA9IGRlZmF1bHRDb21ldE9wdGlvbnM7XG5cbiAgICBpZiAoZGVmYXVsdENvbWV0T3B0aW9ucy5zaGFyZUNvbm5lY3Rpb24gJiYgQ2hhbm5lbE1hbmFnZXIucHJvdG90eXBlLl9jb21ldGQpIHtcbiAgICAgICAgdGhpcy5jb21ldGQgPSBDaGFubmVsTWFuYWdlci5wcm90b3R5cGUuX2NvbWV0ZDtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfVxuICAgIHZhciBjb21ldGQgPSBuZXcgJC5Db21ldEQoKTtcbiAgICBDaGFubmVsTWFuYWdlci5wcm90b3R5cGUuX2NvbWV0ZCA9IGNvbWV0ZDtcblxuICAgIGNvbWV0ZC53ZWJzb2NrZXRFbmFibGVkID0gZGVmYXVsdENvbWV0T3B0aW9ucy53ZWJzb2NrZXRFbmFibGVkO1xuICAgIGNvbWV0ZC5hY2tFbmFibGVkID0gZGVmYXVsdENvbWV0T3B0aW9ucy5hY2tFbmFibGVkO1xuXG4gICAgdGhpcy5pc0Nvbm5lY3RlZCA9IGZhbHNlO1xuICAgIHZhciBjb25uZWN0aW9uQnJva2VuID0gZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJCh0aGlzKS50cmlnZ2VyKCdkaXNjb25uZWN0JywgbWVzc2FnZSk7XG4gICAgfTtcbiAgICB2YXIgY29ubmVjdGlvblN1Y2NlZWRlZCA9IGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlcignY29ubmVjdCcsIG1lc3NhZ2UpO1xuICAgIH07XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIGNvbWV0ZC5jb25maWd1cmUoZGVmYXVsdENvbWV0T3B0aW9ucyk7XG5cbiAgICBjb21ldGQuYWRkTGlzdGVuZXIoJy9tZXRhL2Nvbm5lY3QnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICB2YXIgd2FzQ29ubmVjdGVkID0gdGhpcy5pc0Nvbm5lY3RlZDtcbiAgICAgICAgdGhpcy5pc0Nvbm5lY3RlZCA9IChtZXNzYWdlLnN1Y2Nlc3NmdWwgPT09IHRydWUpO1xuICAgICAgICBpZiAoIXdhc0Nvbm5lY3RlZCAmJiB0aGlzLmlzQ29ubmVjdGVkKSB7IC8vQ29ubmVjdGluZyBmb3IgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgICAgIGNvbm5lY3Rpb25TdWNjZWVkZWQuY2FsbCh0aGlzLCBtZXNzYWdlKTtcbiAgICAgICAgfSBlbHNlIGlmICh3YXNDb25uZWN0ZWQgJiYgIXRoaXMuaXNDb25uZWN0ZWQpIHsgLy9Pbmx5IHRocm93IGRpc2Nvbm5lY3RlZCBtZXNzYWdlIGZybyB0aGUgZmlyc3QgZGlzY29ubmVjdCwgbm90IG9uY2UgcGVyIHRyeVxuICAgICAgICAgICAgY29ubmVjdGlvbkJyb2tlbi5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvZGlzY29ubmVjdCcsIGNvbm5lY3Rpb25Ccm9rZW4pO1xuXG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9oYW5kc2hha2UnLCBmdW5jdGlvbiAobWVzc2FnZSkge1xuICAgICAgICBpZiAobWVzc2FnZS5zdWNjZXNzZnVsKSB7XG4gICAgICAgICAgICAvL2h0dHA6Ly9kb2NzLmNvbWV0ZC5vcmcvcmVmZXJlbmNlL2phdmFzY3JpcHRfc3Vic2NyaWJlLmh0bWwjamF2YXNjcmlwdF9zdWJzY3JpYmVfbWV0YV9jaGFubmVsc1xuICAgICAgICAgICAgLy8gXiBcImR5bmFtaWMgc3Vic2NyaXB0aW9ucyBhcmUgY2xlYXJlZCAobGlrZSBhbnkgb3RoZXIgc3Vic2NyaXB0aW9uKSBhbmQgdGhlIGFwcGxpY2F0aW9uIG5lZWRzIHRvIGZpZ3VyZSBvdXQgd2hpY2ggZHluYW1pYyBzdWJzY3JpcHRpb24gbXVzdCBiZSBwZXJmb3JtZWQgYWdhaW5cIlxuICAgICAgICAgICAgY29tZXRkLmJhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKG1lLmN1cnJlbnRTdWJzY3JpcHRpb25zKS5lYWNoKGZ1bmN0aW9uIChpbmRleCwgc3Vicykge1xuICAgICAgICAgICAgICAgICAgICBjb21ldGQucmVzdWJzY3JpYmUoc3Vicyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy9PdGhlciBpbnRlcmVzdGluZyBldmVudHMgZm9yIHJlZmVyZW5jZVxuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvc3Vic2NyaWJlJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcignc3Vic2NyaWJlJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS91bnN1YnNjcmliZScsIGZ1bmN0aW9uIChtZXNzYWdlKSB7XG4gICAgICAgICQobWUpLnRyaWdnZXIoJ3Vuc3Vic2NyaWJlJywgbWVzc2FnZSk7XG4gICAgfSk7XG4gICAgY29tZXRkLmFkZExpc3RlbmVyKCcvbWV0YS9wdWJsaXNoJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcigncHVibGlzaCcsIG1lc3NhZ2UpO1xuICAgIH0pO1xuICAgIGNvbWV0ZC5hZGRMaXN0ZW5lcignL21ldGEvdW5zdWNjZXNzZnVsJywgZnVuY3Rpb24gKG1lc3NhZ2UpIHtcbiAgICAgICAgJChtZSkudHJpZ2dlcignZXJyb3InLCBtZXNzYWdlKTtcbiAgICB9KTtcblxuICAgIGNvbWV0ZC5oYW5kc2hha2UoZGVmYXVsdENvbWV0T3B0aW9ucy5oYW5kc2hha2UpO1xuXG4gICAgdGhpcy5jb21ldGQgPSBjb21ldGQ7XG59O1xuXG5cbkNoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZSA9ICQuZXh0ZW5kKENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZSwge1xuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlcyBhbmQgcmV0dXJucyBhIGNoYW5uZWwsIHRoYXQgaXMsIGFuIGluc3RhbmNlIG9mIGEgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgICB2YXIgY2hhbm5lbCA9IGNtLmdldENoYW5uZWwoKTtcbiAgICAgKlxuICAgICAqICAgICAgY2hhbm5lbC5zdWJzY3JpYmUoJ3RvcGljJywgY2FsbGJhY2spO1xuICAgICAqICAgICAgY2hhbm5lbC5wdWJsaXNoKCd0b3BpYycsIHsgbXlEYXRhOiAxMDAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gb3B0aW9ucyAoT3B0aW9uYWwpIElmIHN0cmluZywgYXNzdW1lZCB0byBiZSB0aGUgYmFzZSBjaGFubmVsIHVybC4gSWYgb2JqZWN0LCBhc3N1bWVkIHRvIGJlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAqIEByZXR1cm4ge0NoYW5uZWx9IENoYW5uZWwgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBnZXRDaGFubmVsOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAvL0lmIHlvdSBqdXN0IHdhbnQgdG8gcGFzcyBpbiBhIHN0cmluZ1xuICAgICAgICBpZiAob3B0aW9ucyAmJiAhJC5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0ge1xuICAgICAgICAgICAgICAgIGJhc2U6IG9wdGlvbnNcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAgICAgdHJhbnNwb3J0OiB0aGlzLmNvbWV0ZFxuICAgICAgICB9O1xuICAgICAgICB2YXIgY2hhbm5lbCA9IG5ldyBDaGFubmVsKCQuZXh0ZW5kKHRydWUsIHt9LCB0aGlzLm9wdGlvbnMuY2hhbm5lbCwgZGVmYXVsdHMsIG9wdGlvbnMpKTtcblxuXG4gICAgICAgIC8vV3JhcCBzdWJzIGFuZCB1bnN1YnMgc28gd2UgY2FuIHVzZSBpdCB0byByZS1hdHRhY2ggaGFuZGxlcnMgYWZ0ZXIgYmVpbmcgZGlzY29ubmVjdGVkXG4gICAgICAgIHZhciBzdWJzID0gY2hhbm5lbC5zdWJzY3JpYmU7XG4gICAgICAgIGNoYW5uZWwuc3Vic2NyaWJlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHN1YmlkID0gc3Vicy5hcHBseShjaGFubmVsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucyA9IHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnMuY29uY2F0KHN1YmlkKTtcbiAgICAgICAgICAgIHJldHVybiBzdWJpZDtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG5cbiAgICAgICAgdmFyIHVuc3VicyA9IGNoYW5uZWwudW5zdWJzY3JpYmU7XG4gICAgICAgIGNoYW5uZWwudW5zdWJzY3JpYmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZCA9IHVuc3Vicy5hcHBseShjaGFubmVsLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmN1cnJlbnRTdWJzY3JpcHRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFN1YnNjcmlwdGlvbnNbaV0uaWQgPT09IHJlbW92ZWQuaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3Vic2NyaXB0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJlbW92ZWQ7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gY2hhbm5lbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RhcnQgbGlzdGVuaW5nIGZvciBldmVudHMgb24gdGhpcyBpbnN0YW5jZS4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9vbi8uXG4gICAgICpcbiAgICAgKiBTdXBwb3J0ZWQgZXZlbnRzIGFyZTogYGNvbm5lY3RgLCBgZGlzY29ubmVjdGAsIGBzdWJzY3JpYmVgLCBgdW5zdWJzY3JpYmVgLCBgcHVibGlzaGAsIGBlcnJvcmAuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0eXBlLiBTZWUgbW9yZSBkZXRhaWwgYXQgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29uLy5cbiAgICAgKi9cbiAgICBvbjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykub24uYXBwbHkoJCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogU3RvcCBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvbiB0aGlzIGluc3RhbmNlLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29mZi8uXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0eXBlLiBTZWUgbW9yZSBkZXRhaWwgYXQgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29mZi8uXG4gICAgICovXG4gICAgb2ZmOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS5vZmYuYXBwbHkoJCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogVHJpZ2dlciBldmVudHMgYW5kIGV4ZWN1dGUgaGFuZGxlcnMuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vdHJpZ2dlci8uXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IGV2ZW50IFRoZSBldmVudCB0eXBlLiBTZWUgbW9yZSBkZXRhaWwgYXQgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL3RyaWdnZXIvLlxuICAgICAqL1xuICAgIHRyaWdnZXI6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLnRyaWdnZXIuYXBwbHkoJCh0aGlzKSwgYXJndW1lbnRzKTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBDaGFubmVsTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4gKiAjIyBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyXG4gKlxuICogVGhlIEVwaWNlbnRlciBwbGF0Zm9ybSBwcm92aWRlcyBhIHB1c2ggY2hhbm5lbCwgd2hpY2ggYWxsb3dzIHlvdSB0byBwdWJsaXNoIGFuZCBzdWJzY3JpYmUgdG8gbWVzc2FnZXMgd2l0aGluIGEgW3Byb2plY3RdKC4uLy4uLy4uL2dsb3NzYXJ5LyNwcm9qZWN0cyksIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcyksIG9yIFttdWx0aXBsYXllciB3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS4gVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogVGhlIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaXMgYSB3cmFwcGVyIGFyb3VuZCB0aGUgKG1vcmUgZ2VuZXJpYykgW0NoYW5uZWwgTWFuYWdlcl0oLi4vY2hhbm5lbC1tYW5hZ2VyLyksIHRvIGluc3RhbnRpYXRlIGl0IHdpdGggRXBpY2VudGVyLXNwZWNpZmljIGRlZmF1bHRzLiBJZiB5b3UgYXJlIGludGVyZXN0ZWQgaW4gaW5jbHVkaW5nIGEgbm90aWZpY2F0aW9uIG9yIGNoYXQgZmVhdHVyZSBpbiB5b3VyIHByb2plY3QsIHVzaW5nIGFuIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIgaXMgcHJvYmFibHkgdGhlIGVhc2llc3Qgd2F5IHRvIGdldCBzdGFydGVkLlxuICpcbiAqIFlvdSdsbCBuZWVkIHRvIGluY2x1ZGUgdGhlIGBlcGljZW50ZXItbXVsdGlwbGF5ZXItZGVwZW5kZW5jaWVzLmpzYCBsaWJyYXJ5IGluIGFkZGl0aW9uIHRvIHRoZSBgZXBpY2VudGVyLmpzYCBsaWJyYXJ5IGluIHlvdXIgcHJvamVjdCB0byB1c2UgdGhlIEVwaWNlbnRlciBDaGFubmVsIE1hbmFnZXIuIFNlZSBbSW5jbHVkaW5nIEVwaWNlbnRlci5qc10oLi4vLi4vI2luY2x1ZGUpLlxuICpcbiAqIFRvIHVzZSB0aGUgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcjogaW5zdGFudGlhdGUgaXQsIGdldCB0aGUgY2hhbm5lbCBvZiB0aGUgc2NvcGUgeW91IHdhbnQgKFt1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCBbd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCksIG9yIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykpLCB0aGVuIHVzZSB0aGUgY2hhbm5lbCdzIGBzdWJzY3JpYmUoKWAgYW5kIGBwdWJsaXNoKClgIG1ldGhvZHMgdG8gc3Vic2NyaWJlIHRvIHRvcGljcyBvciBwdWJsaXNoIGRhdGEgdG8gdG9waWNzLlxuICpcbiAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gKiAgICAgdmFyIGdjID0gY20uZ2V0R3JvdXBDaGFubmVsKCk7XG4gKiAgICAgZ2Muc3Vic2NyaWJlKCdicm9hZGNhc3RzJywgY2FsbGJhY2spO1xuICpcbiAqIEZvciBhZGRpdGlvbmFsIGJhY2tncm91bmQgb24gRXBpY2VudGVyJ3MgcHVzaCBjaGFubmVsLCBzZWUgdGhlIGludHJvZHVjdG9yeSBub3RlcyBvbiB0aGUgW1B1c2ggQ2hhbm5lbCBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLykgcGFnZS5cbiAqXG4gKiBUaGUgcGFyYW1ldGVycyBmb3IgaW5zdGFudGlhdGluZyBhbiBFcGljZW50ZXIgQ2hhbm5lbCBNYW5hZ2VyIGluY2x1ZGU6XG4gKlxuICogKiBgb3B0aW9uc2AgT2JqZWN0IHdpdGggZGV0YWlscyBhYm91dCB0aGUgRXBpY2VudGVyIHByb2plY3QgZm9yIHRoaXMgRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlciBpbnN0YW5jZS5cbiAqICogYG9wdGlvbnMuYWNjb3VudGAgVGhlIEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiAqICogYG9wdGlvbnMucHJvamVjdGAgRXBpY2VudGVyIHByb2plY3QgaWQuXG4gKiAqIGBvcHRpb25zLnVzZXJOYW1lYCBFcGljZW50ZXIgdXNlck5hbWUgdXNlZCBmb3IgYXV0aGVudGljYXRpb24uXG4gKiAqIGBvcHRpb25zLnVzZXJJZGAgRXBpY2VudGVyIHVzZXIgaWQgdXNlZCBmb3IgYXV0aGVudGljYXRpb24uIE9wdGlvbmFsOyBgb3B0aW9ucy51c2VyTmFtZWAgaXMgcHJlZmVycmVkLlxuICogKiBgb3B0aW9ucy50b2tlbmAgRXBpY2VudGVyIHRva2VuIHVzZWQgZm9yIGF1dGhlbnRpY2F0aW9uLiAoWW91IGNhbiByZXRyaWV2ZSB0aGlzIHVzaW5nIGBhdXRoTWFuYWdlci5nZXRUb2tlbigpYCBmcm9tIHRoZSBbQXV0aG9yaXphdGlvbiBNYW5hZ2VyXSguLi9hdXRoLW1hbmFnZXIvKS4pXG4gKiAqIGBvcHRpb25zLmFsbG93QWxsQ2hhbm5lbHNgIElmIG5vdCBpbmNsdWRlZCBvciBpZiBzZXQgdG8gYGZhbHNlYCwgYWxsIGNoYW5uZWwgcGF0aHMgYXJlIHZhbGlkYXRlZDsgaWYgeW91ciBwcm9qZWN0IHJlcXVpcmVzIFtQdXNoIENoYW5uZWwgQXV0aG9yaXphdGlvbl0oLi4vLi4vLi4vdXBkYXRpbmdfeW91cl9zZXR0aW5ncy8pLCB5b3Ugc2hvdWxkIHVzZSB0aGlzIG9wdGlvbi4gSWYgeW91IHdhbnQgdG8gYWxsb3cgb3RoZXIgY2hhbm5lbCBwYXRocywgc2V0IHRvIGB0cnVlYDsgdGhpcyBpcyBub3QgY29tbW9uLlxuICovXG5cbnZhciBDaGFubmVsTWFuYWdlciA9IHJlcXVpcmUoJy4vY2hhbm5lbC1tYW5hZ2VyJyk7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgdXJsU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxudmFyIHZhbGlkVHlwZXMgPSB7XG4gICAgcHJvamVjdDogdHJ1ZSxcbiAgICBncm91cDogdHJ1ZSxcbiAgICB3b3JsZDogdHJ1ZSxcbiAgICB1c2VyOiB0cnVlLFxuICAgIGRhdGE6IHRydWUsXG4gICAgZ2VuZXJhbDogdHJ1ZSxcbiAgICBjaGF0OiB0cnVlXG59O1xudmFyIGdldEZyb21TZXNzaW9uT3JFcnJvciA9IGZ1bmN0aW9uICh2YWx1ZSwgc2Vzc2lvbktleU5hbWUsIHNldHRpbmdzKSB7XG4gICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICBpZiAoc2V0dGluZ3MgJiYgc2V0dGluZ3Nbc2Vzc2lvbktleU5hbWVdKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IHNldHRpbmdzW3Nlc3Npb25LZXlOYW1lXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihzZXNzaW9uS2V5TmFtZSArICcgbm90IGZvdW5kLiBQbGVhc2UgbG9nLWluIGFnYWluLCBvciBzcGVjaWZ5ICcgKyBzZXNzaW9uS2V5TmFtZSArICcgZXhwbGljaXRseScpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiB2YWx1ZTtcbn07XG52YXIgX19zdXBlciA9IENoYW5uZWxNYW5hZ2VyLnByb3RvdHlwZTtcbnZhciBFcGljZW50ZXJDaGFubmVsTWFuYWdlciA9IGNsYXNzRnJvbShDaGFubmVsTWFuYWdlciwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKG9wdGlvbnMpO1xuICAgICAgICB2YXIgZGVmYXVsdENvbWV0T3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhvcHRpb25zKTtcblxuICAgICAgICB2YXIgdXJsT3B0cyA9IHVybFNlcnZpY2UoZGVmYXVsdENvbWV0T3B0aW9ucy5zZXJ2ZXIpO1xuICAgICAgICBpZiAoIWRlZmF1bHRDb21ldE9wdGlvbnMudXJsKSB7XG4gICAgICAgICAgICAvL0RlZmF1bHQgZXBpY2VudGVyIGNvbWV0ZCBlbmRwb2ludFxuICAgICAgICAgICAgZGVmYXVsdENvbWV0T3B0aW9ucy51cmwgPSB1cmxPcHRzLnByb3RvY29sICsgJzovLycgKyB1cmxPcHRzLmhvc3QgKyAnL2NoYW5uZWwvc3Vic2NyaWJlJztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkZWZhdWx0Q29tZXRPcHRpb25zLmhhbmRzaGFrZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB2YXIgdXNlck5hbWUgPSBkZWZhdWx0Q29tZXRPcHRpb25zLnVzZXJOYW1lO1xuICAgICAgICAgICAgdmFyIHVzZXJJZCA9IGRlZmF1bHRDb21ldE9wdGlvbnMudXNlcklkO1xuICAgICAgICAgICAgdmFyIHRva2VuID0gZGVmYXVsdENvbWV0T3B0aW9ucy50b2tlbjtcbiAgICAgICAgICAgIGlmICgodXNlck5hbWUgfHwgdXNlcklkKSAmJiB0b2tlbikge1xuICAgICAgICAgICAgICAgIHZhciB1c2VyUHJvcCA9IHVzZXJOYW1lID8gJ3VzZXJOYW1lJyA6ICd1c2VySWQnO1xuICAgICAgICAgICAgICAgIHZhciBleHQgPSB7XG4gICAgICAgICAgICAgICAgICAgIGF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHRva2VuXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBleHRbdXNlclByb3BdID0gdXNlck5hbWUgPyB1c2VyTmFtZSA6IHVzZXJJZDtcblxuICAgICAgICAgICAgICAgIGRlZmF1bHRDb21ldE9wdGlvbnMuaGFuZHNoYWtlID0ge1xuICAgICAgICAgICAgICAgICAgICBleHQ6IGV4dFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLm9wdGlvbnMgPSBkZWZhdWx0Q29tZXRPcHRpb25zO1xuICAgICAgICByZXR1cm4gX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIGRlZmF1bHRDb21ldE9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgY2hhbm5lbCwgdGhhdCBpcywgYW4gaW5zdGFuY2Ugb2YgYSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKS5cbiAgICAgKlxuICAgICAqIFRoaXMgbWV0aG9kIGVuZm9yY2VzIEVwaWNlbnRlci1zcGVjaWZpYyBjaGFubmVsIG5hbWluZzogYWxsIGNoYW5uZWxzIHJlcXVlc3RlZCBtdXN0IGJlIGluIHRoZSBmb3JtIGAve3R5cGV9L3thY2NvdW50IGlkfS97cHJvamVjdCBpZH0vey4uLn1gLCB3aGVyZSBgdHlwZWAgaXMgb25lIG9mIGBydW5gLCBgZGF0YWAsIGB1c2VyYCwgYHdvcmxkYCwgb3IgYGNoYXRgLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5FcGljZW50ZXJDaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICAgdmFyIGNoYW5uZWwgPSBjbS5nZXRDaGFubmVsKCcvZ3JvdXAvYWNtZS9zdXBwbHktY2hhaW4tZ2FtZS8nKTtcbiAgICAgKlxuICAgICAqICAgICAgY2hhbm5lbC5zdWJzY3JpYmUoJ3RvcGljJywgY2FsbGJhY2spO1xuICAgICAqICAgICAgY2hhbm5lbC5wdWJsaXNoKCd0b3BpYycsIHsgbXlEYXRhOiAxMDAgfSk7XG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSB7T2JqZWN0fFN0cmluZ30gb3B0aW9ucyAoT3B0aW9uYWwpIElmIHN0cmluZywgYXNzdW1lZCB0byBiZSB0aGUgYmFzZSBjaGFubmVsIHVybC4gSWYgb2JqZWN0LCBhc3N1bWVkIHRvIGJlIGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGNvbnN0cnVjdG9yLlxuICAgICAqIEByZXR1cm4ge0NoYW5uZWx9IENoYW5uZWwgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBnZXRDaGFubmVsOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAob3B0aW9ucyAmJiB0eXBlb2Ygb3B0aW9ucyAhPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7XG4gICAgICAgICAgICAgICAgYmFzZTogb3B0aW9uc1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgY2hhbm5lbE9wdHMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIGJhc2UgPSBjaGFubmVsT3B0cy5iYXNlO1xuICAgICAgICBpZiAoIWJhc2UpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gYmFzZSB0b3BpYyB3YXMgcHJvdmlkZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY2hhbm5lbE9wdHMuYWxsb3dBbGxDaGFubmVscykge1xuICAgICAgICAgICAgdmFyIGJhc2VQYXJ0cyA9IGJhc2Uuc3BsaXQoJy8nKTtcbiAgICAgICAgICAgIHZhciBjaGFubmVsVHlwZSA9IGJhc2VQYXJ0c1sxXTtcbiAgICAgICAgICAgIGlmIChiYXNlUGFydHMubGVuZ3RoIDwgNCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ludmFsaWQgY2hhbm5lbCBiYXNlIG5hbWUsIGl0IG11c3QgYmUgaW4gdGhlIGZvcm0gL3t0eXBlfS97YWNjb3VudCBpZH0ve3Byb2plY3QgaWR9L3suLi59Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIXZhbGlkVHlwZXNbY2hhbm5lbFR5cGVdKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdJbnZhbGlkIGNoYW5uZWwgdHlwZScpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSBmb3IgdGhlIGdpdmVuIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuIFRoZSBncm91cCBtdXN0IGV4aXN0IGluIHRoZSBhY2NvdW50ICh0ZWFtKSBhbmQgcHJvamVjdCBwcm92aWRlZC5cbiAgICAgKlxuICAgICAqIFRoZXJlIGFyZSBubyBub3RpZmljYXRpb25zIGZyb20gRXBpY2VudGVyIG9uIHRoaXMgY2hhbm5lbDsgYWxsIG1lc3NhZ2VzIGFyZSB1c2VyLW9yaWdpbmF0ZWQuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIGdjID0gY20uZ2V0R3JvdXBDaGFubmVsKCk7XG4gICAgICogICAgIGdjLnN1YnNjcmliZSgnYnJvYWRjYXN0cycsIGNhbGxiYWNrKTtcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBHcm91cCB0byBicm9hZGNhc3QgdG8uIElmIG5vdCBwcm92aWRlZCwgcGlja3MgdXAgZ3JvdXAgZnJvbSBjdXJyZW50IHNlc3Npb24gaWYgZW5kIHVzZXIgaXMgbG9nZ2VkIGluLlxuICAgICAqIEByZXR1cm4ge0NoYW5uZWx9IENoYW5uZWwgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBnZXRHcm91cENoYW5uZWw6IGZ1bmN0aW9uIChncm91cE5hbWUpIHtcbiAgICAgICAgdmFyIHNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnModGhpcy5vcHRpb25zKTtcbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScsIHNlc3Npb24pO1xuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0Jywgc2Vzc2lvbik7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL2dyb3VwJywgYWNjb3VudCwgcHJvamVjdCwgZ3JvdXBOYW1lXS5qb2luKCcvJyk7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSBmb3IgdGhlIGdpdmVuIFt3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS5cbiAgICAgKlxuICAgICAqIFRoaXMgaXMgdHlwaWNhbGx5IHVzZWQgdG9nZXRoZXIgd2l0aCB0aGUgW1dvcmxkIE1hbmFnZXJdKC4uL3dvcmxkLW1hbmFnZXIpLlxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciB3b3JsZE1hbmFnZXIgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4gICAgICogICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICogICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAqICAgICAgICAgZ3JvdXA6ICd0ZWFtMScsXG4gICAgICogICAgICAgICBydW46IHsgbW9kZWw6ICdtb2RlbC5lcW4nIH1cbiAgICAgKiAgICAgfSk7XG4gICAgICogICAgIHdvcmxkTWFuYWdlci5nZXRDdXJyZW50V29ybGQoKS50aGVuKGZ1bmN0aW9uICh3b3JsZE9iamVjdCwgd29ybGRBZGFwdGVyKSB7XG4gICAgICogICAgICAgICB2YXIgd29ybGRDaGFubmVsID0gY20uZ2V0V29ybGRDaGFubmVsKHdvcmxkT2JqZWN0KTtcbiAgICAgKiAgICAgICAgIHdvcmxkQ2hhbm5lbC5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICogICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICogICAgICAgICB9KTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB3b3JsZCBUaGUgd29ybGQgb2JqZWN0IG9yIGlkLlxuICAgICAqIEBwYXJhbSAge1N0cmluZ30gZ3JvdXBOYW1lIChPcHRpb25hbCkgR3JvdXAgdGhlIHdvcmxkIGV4aXN0cyBpbi4gSWYgbm90IHByb3ZpZGVkLCBwaWNrcyB1cCBncm91cCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHJldHVybiB7Q2hhbm5lbH0gQ2hhbm5lbCBpbnN0YW5jZVxuICAgICAqL1xuICAgIGdldFdvcmxkQ2hhbm5lbDogZnVuY3Rpb24gKHdvcmxkLCBncm91cE5hbWUpIHtcbiAgICAgICAgdmFyIHdvcmxkaWQgPSAoJC5pc1BsYWluT2JqZWN0KHdvcmxkKSAmJiB3b3JsZC5pZCkgPyB3b3JsZC5pZCA6IHdvcmxkO1xuICAgICAgICBpZiAoIXdvcmxkaWQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgYSB3b3JsZCBpZCcpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHRoaXMub3B0aW9ucyk7XG5cbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScsIHNlc3Npb24pO1xuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0Jywgc2Vzc2lvbik7XG5cbiAgICAgICAgdmFyIGJhc2VUb3BpYyA9IFsnL3dvcmxkJywgYWNjb3VudCwgcHJvamVjdCwgZ3JvdXBOYW1lLCB3b3JsZGlkXS5qb2luKCcvJyk7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSBmb3IgdGhlIGN1cnJlbnQgW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpIGluIHRoYXQgdXNlcidzIGN1cnJlbnQgW3dvcmxkXSguLi8uLi8uLi9nbG9zc2FyeS8jd29ybGQpLlxuICAgICAqXG4gICAgICogVGhpcyBpcyB0eXBpY2FsbHkgdXNlZCB0b2dldGhlciB3aXRoIHRoZSBbV29ybGQgTWFuYWdlcl0oLi4vd29ybGQtbWFuYWdlcikuIE5vdGUgdGhhdCB0aGlzIGNoYW5uZWwgb25seSBnZXRzIG5vdGlmaWNhdGlvbnMgZm9yIHdvcmxkcyBjdXJyZW50bHkgaW4gbWVtb3J5LiAoU2VlIG1vcmUgYmFja2dyb3VuZCBvbiBbcGVyc2lzdGVuY2VdKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZSkuKVxuICAgICAqXG4gICAgICogKipFeGFtcGxlKipcbiAgICAgKlxuICAgICAqICAgICB2YXIgY20gPSBuZXcgRi5tYW5hZ2VyLkNoYW5uZWxNYW5hZ2VyKCk7XG4gICAgICogICAgIHZhciB3b3JsZE1hbmFnZXIgPSBuZXcgRi5tYW5hZ2VyLldvcmxkTWFuYWdlcih7XG4gICAgICogICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICogICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAqICAgICAgICAgZ3JvdXA6ICd0ZWFtMScsXG4gICAgICogICAgICAgICBydW46IHsgbW9kZWw6ICdtb2RlbC5lcW4nIH1cbiAgICAgKiAgICAgfSk7XG4gICAgICogICAgIHdvcmxkTWFuYWdlci5nZXRDdXJyZW50V29ybGQoKS50aGVuKGZ1bmN0aW9uICh3b3JsZE9iamVjdCwgd29ybGRBZGFwdGVyKSB7XG4gICAgICogICAgICAgICB2YXIgdXNlckNoYW5uZWwgPSBjbS5nZXRVc2VyQ2hhbm5lbCh3b3JsZE9iamVjdCk7XG4gICAgICogICAgICAgICB1c2VyQ2hhbm5lbC5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICogICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICogICAgICAgICB9KTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICpcbiAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICpcbiAgICAgKiAqICpDaGFubmVsKiBSZXR1cm5zIHRoZSBjaGFubmVsIChhbiBpbnN0YW5jZSBvZiB0aGUgW0NoYW5uZWwgU2VydmljZV0oLi4vY2hhbm5lbC1zZXJ2aWNlLykpLlxuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xPYmplY3R9IHdvcmxkIFdvcmxkIG9iamVjdCBvciBpZC5cbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB1c2VyIChPcHRpb25hbCkgVXNlciBvYmplY3Qgb3IgaWQuIElmIG5vdCBwcm92aWRlZCwgcGlja3MgdXAgdXNlciBpZCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0VXNlckNoYW5uZWw6IGZ1bmN0aW9uICh3b3JsZCwgdXNlciwgZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciB3b3JsZGlkID0gKCQuaXNQbGFpbk9iamVjdCh3b3JsZCkgJiYgd29ybGQuaWQpID8gd29ybGQuaWQgOiB3b3JsZDtcbiAgICAgICAgaWYgKCF3b3JsZGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgd29ybGQgaWQnKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh0aGlzLm9wdGlvbnMpO1xuXG4gICAgICAgIHZhciB1c2VyaWQgPSAoJC5pc1BsYWluT2JqZWN0KHVzZXIpICYmIHVzZXIuaWQpID8gdXNlci5pZCA6IHVzZXI7XG4gICAgICAgIHVzZXJpZCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcih1c2VyaWQsICd1c2VySWQnLCBzZXNzaW9uKTtcbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScsIHNlc3Npb24pO1xuXG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHNlc3Npb24pO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCBzZXNzaW9uKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvdXNlcicsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZSwgd29ybGRpZCwgdXNlcmlkXS5qb2luKCcvJyk7XG4gICAgICAgIHJldHVybiBfX3N1cGVyLmdldENoYW5uZWwuY2FsbCh0aGlzLCB7IGJhc2U6IGJhc2VUb3BpYyB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSB0aGF0IGF1dG9tYXRpY2FsbHkgdHJhY2tzIHRoZSBwcmVzZW5jZSBvZiBhbiBbZW5kIHVzZXJdKC4uLy4uLy4uL2dsb3NzYXJ5LyN1c2VycyksIHRoYXQgaXMsIHdoZXRoZXIgdGhlIGVuZCB1c2VyIGlzIGN1cnJlbnRseSBvbmxpbmUgaW4gdGhpcyBncm91cCBhbmQgd29ybGQuIE5vdGlmaWNhdGlvbnMgYXJlIGF1dG9tYXRpY2FsbHkgc2VudCB3aGVuIHRoZSBlbmQgdXNlciBjb21lcyBvbmxpbmUsIGFuZCB3aGVuIHRoZSBlbmQgdXNlciBnb2VzIG9mZmxpbmUgKG5vdCBwcmVzZW50IGZvciBtb3JlIHRoYW4gMiBtaW51dGVzKS4gVXNlZnVsIGluIG11bHRpcGxheWVyIGdhbWVzIGZvciBsZXR0aW5nIGVhY2ggZW5kIHVzZXIga25vdyB3aGV0aGVyIG90aGVyIHVzZXJzIGluIHRoZWlyIHNoYXJlZCB3b3JsZCBhcmUgYWxzbyBvbmxpbmUuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgIHZhciBjbSA9IG5ldyBGLm1hbmFnZXIuQ2hhbm5lbE1hbmFnZXIoKTtcbiAgICAgKiAgICAgdmFyIHdvcmxkTWFuYWdlciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiAgICAgKiAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgKiAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICogICAgICAgICBtb2RlbDogJ21vZGVsLmVxbidcbiAgICAgKiAgICAgfSk7XG4gICAgICogICAgIHdvcmxkTWFuYWdlci5nZXRDdXJyZW50V29ybGQoKS50aGVuKGZ1bmN0aW9uICh3b3JsZE9iamVjdCwgd29ybGRTZXJ2aWNlKSB7XG4gICAgICogICAgICAgICB2YXIgcHJlc2VuY2VDaGFubmVsID0gY20uZ2V0UHJlc2VuY2VDaGFubmVsKHdvcmxkT2JqZWN0KTtcbiAgICAgKiAgICAgICAgIHByZXNlbmNlQ2hhbm5lbC5vbigncHJlc2VuY2UnLCBmdW5jdGlvbiAoZXZ0LCBub3RpZmljYXRpb24pIHtcbiAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2cobm90aWZpY2F0aW9uLm9ubGluZSwgbm90aWZpY2F0aW9uLnVzZXJJZCk7XG4gICAgICogICAgICAgICAgfSk7XG4gICAgICogICAgICB9KTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqQ2hhbm5lbCogUmV0dXJucyB0aGUgY2hhbm5lbCAoYW4gaW5zdGFuY2Ugb2YgdGhlIFtDaGFubmVsIFNlcnZpY2VdKC4uL2NoYW5uZWwtc2VydmljZS8pKS5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSB3b3JsZCBXb3JsZCBvYmplY3Qgb3IgaWQuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE9iamVjdH0gdXNlcmlkIChPcHRpb25hbCkgVXNlciBvYmplY3Qgb3IgaWQuIElmIG5vdCBwcm92aWRlZCwgcGlja3MgdXAgdXNlciBpZCBmcm9tIGN1cnJlbnQgc2Vzc2lvbiBpZiBlbmQgdXNlciBpcyBsb2dnZWQgaW4uXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBncm91cE5hbWUgKE9wdGlvbmFsKSBHcm91cCB0aGUgd29ybGQgZXhpc3RzIGluLiBJZiBub3QgcHJvdmlkZWQsIHBpY2tzIHVwIGdyb3VwIGZyb20gY3VycmVudCBzZXNzaW9uIGlmIGVuZCB1c2VyIGlzIGxvZ2dlZCBpbi5cbiAgICAgKiBAcmV0dXJuIHtDaGFubmVsfSBDaGFubmVsIGluc3RhbmNlXG4gICAgICovXG4gICAgZ2V0UHJlc2VuY2VDaGFubmVsOiBmdW5jdGlvbiAod29ybGQsIHVzZXJpZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgIHZhciB3b3JsZGlkID0gKCQuaXNQbGFpbk9iamVjdCh3b3JsZCkgJiYgd29ybGQuaWQpID8gd29ybGQuaWQgOiB3b3JsZDtcbiAgICAgICAgaWYgKCF3b3JsZGlkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgd29ybGQgaWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKHRoaXMub3B0aW9ucyk7XG4gICAgICAgIHVzZXJpZCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcih1c2VyaWQsICd1c2VySWQnLCBzZXNzaW9uKTtcbiAgICAgICAgZ3JvdXBOYW1lID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKGdyb3VwTmFtZSwgJ2dyb3VwTmFtZScsIHNlc3Npb24pO1xuXG4gICAgICAgIHZhciBhY2NvdW50ID0gZ2V0RnJvbVNlc3Npb25PckVycm9yKCcnLCAnYWNjb3VudCcsIHNlc3Npb24pO1xuICAgICAgICB2YXIgcHJvamVjdCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ3Byb2plY3QnLCBzZXNzaW9uKTtcblxuICAgICAgICB2YXIgYmFzZVRvcGljID0gWycvdXNlcicsIGFjY291bnQsIHByb2plY3QsIGdyb3VwTmFtZSwgd29ybGRpZF0uam9pbignLycpO1xuICAgICAgICB2YXIgY2hhbm5lbCA9IF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuXG4gICAgICAgIHZhciBsYXN0UGluZ1RpbWUgPSB7IH07XG5cbiAgICAgICAgdmFyIFBJTkdfSU5URVJWQUwgPSA2MDAwO1xuICAgICAgICBjaGFubmVsLnN1YnNjcmliZSgnaW50ZXJuYWwtcGluZy1jaGFubmVsJywgZnVuY3Rpb24gKG5vdGlmaWNhdGlvbikge1xuICAgICAgICAgICAgdmFyIGluY29taW5nVXNlcklkID0gbm90aWZpY2F0aW9uLmRhdGEudXNlcjtcbiAgICAgICAgICAgIGlmICghbGFzdFBpbmdUaW1lW2luY29taW5nVXNlcklkXSAmJiBpbmNvbWluZ1VzZXJJZCAhPT0gdXNlcmlkKSB7XG4gICAgICAgICAgICAgICAgY2hhbm5lbC50cmlnZ2VyKCdwcmVzZW5jZScsIHsgdXNlcklkOiBpbmNvbWluZ1VzZXJJZCwgb25saW5lOiB0cnVlIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbGFzdFBpbmdUaW1lW2luY29taW5nVXNlcklkXSA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNoYW5uZWwucHVibGlzaCgnaW50ZXJuYWwtcGluZy1jaGFubmVsJywgeyB1c2VyOiB1c2VyaWQgfSk7XG5cbiAgICAgICAgICAgICQuZWFjaChsYXN0UGluZ1RpbWUsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSgpKS52YWx1ZU9mKCk7XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICYmIHZhbHVlICsgKFBJTkdfSU5URVJWQUwgKiAyKSA8IG5vdykge1xuICAgICAgICAgICAgICAgICAgICBsYXN0UGluZ1RpbWVba2V5XSA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIGNoYW5uZWwudHJpZ2dlcigncHJlc2VuY2UnLCB7IHVzZXJJZDoga2V5LCBvbmxpbmU6IGZhbHNlIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LCBQSU5HX0lOVEVSVkFMKTtcblxuICAgICAgICByZXR1cm4gY2hhbm5lbDtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogQ3JlYXRlIGFuZCByZXR1cm4gYSBwdWJsaXNoL3N1YnNjcmliZSBjaGFubmVsIChmcm9tIHRoZSB1bmRlcmx5aW5nIFtDaGFubmVsIE1hbmFnZXJdKC4uL2NoYW5uZWwtbWFuYWdlci8pKSBmb3IgdGhlIGdpdmVuIGNvbGxlY3Rpb24uIChUaGUgY29sbGVjdGlvbiBuYW1lIGlzIHNwZWNpZmllZCBpbiB0aGUgYHJvb3RgIGFyZ3VtZW50IHdoZW4gdGhlIFtEYXRhIFNlcnZpY2VdKC4uL2RhdGEtYXBpLXNlcnZpY2UvKSBpcyBpbnN0YW50aWF0ZWQuKSBNdXN0IGJlIG9uZSBvZiB0aGUgY29sbGVjdGlvbnMgaW4gdGhpcyBhY2NvdW50ICh0ZWFtKSBhbmQgcHJvamVjdC5cbiAgICAgKlxuICAgICAqIFRoZXJlIGFyZSBhdXRvbWF0aWMgbm90aWZpY2F0aW9ucyBmcm9tIEVwaWNlbnRlciBvbiB0aGlzIGNoYW5uZWwgd2hlbiBkYXRhIGlzIGNyZWF0ZWQsIHVwZGF0ZWQsIG9yIGRlbGV0ZWQgaW4gdGhpcyBjb2xsZWN0aW9uLiBTZWUgbW9yZSBvbiBbYXV0b21hdGljIG1lc3NhZ2VzIHRvIHRoZSBkYXRhIGNoYW5uZWxdKC4uLy4uLy4uL3Jlc3RfYXBpcy9tdWx0aXBsYXllci9jaGFubmVsLyNkYXRhLW1lc3NhZ2VzKS5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgdmFyIGNtID0gbmV3IEYubWFuYWdlci5DaGFubmVsTWFuYWdlcigpO1xuICAgICAqICAgICB2YXIgZGMgPSBjbS5nZXREYXRhQ2hhbm5lbCgnc3VydmV5LXJlc3BvbnNlcycpO1xuICAgICAqICAgICBkYy5zdWJzY3JpYmUoJycsIGZ1bmN0aW9uKGRhdGEsIG1ldGEpIHtcbiAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgKlxuICAgICAqICAgICAgICAgIC8vIG1ldGEuZGF0ZSBpcyB0aW1lIG9mIGNoYW5nZSxcbiAgICAgKiAgICAgICAgICAvLyBtZXRhLnN1YlR5cGUgaXMgdGhlIGtpbmQgb2YgY2hhbmdlOiBuZXcsIHVwZGF0ZSwgb3IgZGVsZXRlXG4gICAgICogICAgICAgICAgLy8gbWV0YS5wYXRoIGlzIHRoZSBmdWxsIHBhdGggdG8gdGhlIGNoYW5nZWQgZGF0YVxuICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKG1ldGEpO1xuICAgICAqICAgICB9KTtcbiAgICAgKlxuICAgICAqICoqUmV0dXJuIFZhbHVlKipcbiAgICAgKlxuICAgICAqICogKkNoYW5uZWwqIFJldHVybnMgdGhlIGNoYW5uZWwgKGFuIGluc3RhbmNlIG9mIHRoZSBbQ2hhbm5lbCBTZXJ2aWNlXSguLi9jaGFubmVsLXNlcnZpY2UvKSkuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBjb2xsZWN0aW9uIE5hbWUgb2YgY29sbGVjdGlvbiB3aG9zZSBhdXRvbWF0aWMgbm90aWZpY2F0aW9ucyB5b3Ugd2FudCB0byByZWNlaXZlLlxuICAgICAqIEByZXR1cm4ge0NoYW5uZWx9IENoYW5uZWwgaW5zdGFuY2VcbiAgICAgKi9cbiAgICBnZXREYXRhQ2hhbm5lbDogZnVuY3Rpb24gKGNvbGxlY3Rpb24pIHtcbiAgICAgICAgaWYgKCFjb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BsZWFzZSBzcGVjaWZ5IGEgY29sbGVjdGlvbiB0byBsaXN0ZW4gb24uJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyh0aGlzLm9wdGlvbnMpO1xuICAgICAgICB2YXIgYWNjb3VudCA9IGdldEZyb21TZXNzaW9uT3JFcnJvcignJywgJ2FjY291bnQnLCBzZXNzaW9uKTtcbiAgICAgICAgdmFyIHByb2plY3QgPSBnZXRGcm9tU2Vzc2lvbk9yRXJyb3IoJycsICdwcm9qZWN0Jywgc2Vzc2lvbik7XG4gICAgICAgIHZhciBiYXNlVG9waWMgPSBbJy9kYXRhJywgYWNjb3VudCwgcHJvamVjdCwgY29sbGVjdGlvbl0uam9pbignLycpO1xuICAgICAgICB2YXIgY2hhbm5lbCA9IF9fc3VwZXIuZ2V0Q2hhbm5lbC5jYWxsKHRoaXMsIHsgYmFzZTogYmFzZVRvcGljIH0pO1xuXG4gICAgICAgIC8vVE9ETzogRml4IGFmdGVyIEVwaWNlbnRlciBidWcgaXMgcmVzb2x2ZWRcbiAgICAgICAgdmFyIG9sZHN1YnMgPSBjaGFubmVsLnN1YnNjcmliZTtcbiAgICAgICAgY2hhbm5lbC5zdWJzY3JpYmUgPSBmdW5jdGlvbiAodG9waWMsIGNhbGxiYWNrLCBjb250ZXh0LCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgY2FsbGJhY2tXaXRoQ2xlYW5EYXRhID0gZnVuY3Rpb24gKHBheWxvYWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgbWV0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgcGF0aDogcGF5bG9hZC5jaGFubmVsLFxuICAgICAgICAgICAgICAgICAgICBzdWJUeXBlOiBwYXlsb2FkLmRhdGEuc3ViVHlwZSxcbiAgICAgICAgICAgICAgICAgICAgZGF0ZTogcGF5bG9hZC5kYXRhLmRhdGVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBhY3R1YWxEYXRhID0gcGF5bG9hZC5kYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgaWYgKGFjdHVhbERhdGEuZGF0YSkgeyAvL0RlbGV0ZSBub3RpZmljYXRpb25zIGFyZSBvbmUgZGF0YS1sZXZlbCBiZWhpbmQgb2YgY291cnNlXG4gICAgICAgICAgICAgICAgICAgIGFjdHVhbERhdGEgPSBhY3R1YWxEYXRhLmRhdGE7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY2FsbGJhY2suY2FsbChjb250ZXh0LCBhY3R1YWxEYXRhLCBtZXRhKTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gb2xkc3Vicy5jYWxsKGNoYW5uZWwsIHRvcGljLCBjYWxsYmFja1dpdGhDbGVhbkRhdGEsIGNvbnRleHQsIG9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHJldHVybiBjaGFubmVsO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEVwaWNlbnRlckNoYW5uZWxNYW5hZ2VyO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBFUElfU0VTU0lPTl9LRVk6ICdlcGljZW50ZXJqcy5zZXNzaW9uJyxcbiAgICBTVFJBVEVHWV9TRVNTSU9OX0tFWTogJ2VwaWNlbnRlci1zY2VuYXJpbydcbn07IiwiLyoqXG4qICMjIFJ1biBNYW5hZ2VyXG4qXG4qIFRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgYWNjZXNzIHRvIHJ1bnMgZm9yIHlvdXIgcHJvamVjdC4gVGhpcyBhbGxvd3MgeW91IHRvIHJlYWQgYW5kIHVwZGF0ZSB2YXJpYWJsZXMsIGNhbGwgb3BlcmF0aW9ucywgZXRjLiBBZGRpdGlvbmFsbHksIHRoZSBSdW4gTWFuYWdlciBnaXZlcyB5b3UgY29udHJvbCBvdmVyIHJ1biBjcmVhdGlvbiBkZXBlbmRpbmcgb24gcnVuIHN0YXRlcy4gU3BlY2lmaWNhbGx5LCB5b3UgY2FuIHNlbGVjdCBbcnVuIGNyZWF0aW9uIHN0cmF0ZWdpZXMgKHJ1bGVzKV0oLi4vc3RyYXRlZ2llcy8pIGZvciB3aGljaCBydW5zIGVuZCB1c2VycyBvZiB5b3VyIHByb2plY3Qgd29yayB3aXRoIHdoZW4gdGhleSBsb2cgaW4gdG8geW91ciBwcm9qZWN0LlxuKlxuKiBUaGVyZSBhcmUgbWFueSB3YXlzIHRvIGNyZWF0ZSBuZXcgcnVucywgaW5jbHVkaW5nIHRoZSBFcGljZW50ZXIuanMgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSwgdGhlIFJFU0ZUZnVsIFtSdW4gQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvYWdncmVnYXRlX3J1bl9hcGkpIGFuZCB0aGUgW01vZGVsIFJ1biBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9vdGhlcl9hcGlzL21vZGVsX2FwaXMvcnVuLykuIEhvd2V2ZXIsIGZvciBzb21lIHByb2plY3RzIGl0IG1ha2VzIG1vcmUgc2Vuc2UgdG8gcGljayB1cCB3aGVyZSB0aGUgdXNlciBsZWZ0IG9mZiwgdXNpbmcgYW4gZXhpc3RpbmcgcnVuLiBBbmQgaW4gc29tZSBwcm9qZWN0cywgd2hldGhlciB0byBjcmVhdGUgYSBuZXcgcnVuIG9yIHVzZSBhbiBleGlzdGluZyBvbmUgaXMgY29uZGl0aW9uYWwsIGZvciBleGFtcGxlIGJhc2VkIG9uIGNoYXJhY3RlcmlzdGljcyBvZiB0aGUgZXhpc3RpbmcgcnVuIG9yIHlvdXIgb3duIGtub3dsZWRnZSBhYm91dCB0aGUgbW9kZWwuIFRoZSBSdW4gTWFuYWdlciBwcm92aWRlcyB0aGlzIGxldmVsIG9mIGNvbnRyb2w6IHlvdXIgY2FsbCB0byBgZ2V0UnVuKClgLCByYXRoZXIgdGhhbiBhbHdheXMgcmV0dXJuaW5nIGEgbmV3IHJ1biwgcmV0dXJucyBhIHJ1biBiYXNlZCBvbiB0aGUgc3RyYXRlZ3kgeW91J3ZlIHNwZWNpZmllZC4gKE5vdGUgdGhhdCBtYW55IG9mIHRoZSBFcGljZW50ZXIgc2FtcGxlIHByb2plY3RzIHVzZSBhIFJ1biBTZXJ2aWNlIGRpcmVjdGx5LCBiZWNhdXNlIGdlbmVyYWxseSB0aGUgc2FtcGxlIHByb2plY3RzIGFyZSBwbGF5ZWQgaW4gb25lIGVuZCB1c2VyIHNlc3Npb24gYW5kIGRvbid0IGNhcmUgYWJvdXQgcnVuIHN0YXRlcyBvciBydW4gc3RyYXRlZ2llcy4pXG4qXG4qXG4qICMjIyBVc2luZyB0aGUgUnVuIE1hbmFnZXIgdG8gY3JlYXRlIGFuZCBhY2Nlc3MgcnVuc1xuKlxuKiBUbyB1c2UgdGhlIFJ1biBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdCBieSBwYXNzaW5nIGluOlxuKlxuKiAgICogYHJ1bmA6IChyZXF1aXJlZCkgUnVuIG9iamVjdC4gTXVzdCBjb250YWluOlxuKiAgICAgICAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuKiAgICAgICAqIGBwcm9qZWN0YDogRXBpY2VudGVyIHByb2plY3QgaWQuXG4qICAgICAgICogYG1vZGVsYDogVGhlIG5hbWUgb2YgeW91ciBwcmltYXJ5IG1vZGVsIGZpbGUuIChTZWUgbW9yZSBvbiBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKS4pXG4qICAgICAgICogYHNjb3BlYDogKG9wdGlvbmFsKSBTY29wZSBvYmplY3QgZm9yIHRoZSBydW4sIGZvciBleGFtcGxlIGBzY29wZS5ncm91cGAgd2l0aCB2YWx1ZSBvZiB0aGUgbmFtZSBvZiB0aGUgZ3JvdXAuXG4qICAgICAgICogYHNlcnZlcmA6IChvcHRpb25hbCkgQW4gb2JqZWN0IHdpdGggb25lIGZpZWxkLCBgaG9zdGAuIFRoZSB2YWx1ZSBvZiBgaG9zdGAgaXMgdGhlIHN0cmluZyBgYXBpLmZvcmlvLmNvbWAsIHRoZSBVUkkgb2YgdGhlIEZvcmlvIHNlcnZlci4gVGhpcyBpcyBhdXRvbWF0aWNhbGx5IHNldCwgYnV0IHlvdSBjYW4gcGFzcyBpdCBleHBsaWNpdGx5IGlmIGRlc2lyZWQuIEl0IGlzIG1vc3QgY29tbW9ubHkgdXNlZCBmb3IgY2xhcml0eSB3aGVuIHlvdSBhcmUgW2hvc3RpbmcgYW4gRXBpY2VudGVyIHByb2plY3Qgb24geW91ciBvd24gc2VydmVyXSguLi8uLi8uLi9ob3dfdG8vc2VsZl9ob3N0aW5nLykuXG4qICAgICAgICogYGZpbGVzYDogKG9wdGlvbmFsKSBJZiBhbmQgb25seSBpZiB5b3UgYXJlIHVzaW5nIGEgVmVuc2ltIG1vZGVsIGFuZCB5b3UgaGF2ZSBhZGRpdGlvbmFsIGRhdGEgdG8gcGFzcyBpbiB0byB5b3VyIG1vZGVsLCB5b3UgY2FuIHBhc3MgYSBgZmlsZXNgIG9iamVjdCB3aXRoIHRoZSBuYW1lcyBvZiB0aGUgZmlsZXMsIGZvciBleGFtcGxlOiBgXCJmaWxlc1wiOiB7XCJkYXRhXCI6IFwibXlFeHRyYURhdGEueGxzXCJ9YC4gKE5vdGUgdGhhdCB5b3UnbGwgYWxzbyBuZWVkIHRvIGFkZCB0aGlzIHNhbWUgZmlsZXMgb2JqZWN0IHRvIHlvdXIgVmVuc2ltIFtjb25maWd1cmF0aW9uIGZpbGVdKC4uLy4uLy4uL21vZGVsX2NvZGUvdmVuc2ltLykuKSBTZWUgdGhlIFt1bmRlcmx5aW5nIE1vZGVsIFJ1biBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9vdGhlcl9hcGlzL21vZGVsX2FwaXMvcnVuLyNwb3N0LWNyZWF0aW5nLWEtbmV3LXJ1bi1mb3ItdGhpcy1wcm9qZWN0KSBmb3IgYWRkaXRpb25hbCBpbmZvcm1hdGlvbi5cbipcbiogICAqIGBzdHJhdGVneWA6IChvcHRpb25hbCkgUnVuIGNyZWF0aW9uIHN0cmF0ZWd5IGZvciB3aGVuIHRvIGNyZWF0ZSBhIG5ldyBydW4gYW5kIHdoZW4gdG8gcmV1c2UgYW4gZW5kIHVzZXIncyBleGlzdGluZyBydW4uIFNlZSBbUnVuIE1hbmFnZXIgU3RyYXRlZ2llc10oLi4vc3RyYXRlZ2llcy8pIGZvciBkZXRhaWxzLiBEZWZhdWx0cyB0byBgbmV3LWlmLWluaXRpYWxpemVkYC5cbipcbiogICAqIGBzZXNzaW9uS2V5YDogKG9wdGlvbmFsKSBOYW1lIG9mIGJyb3dzZXIgY29va2llIGluIHdoaWNoIHRvIHN0b3JlIHJ1biBpbmZvcm1hdGlvbiwgaW5jbHVkaW5nIHJ1biBpZC4gTWFueSBjb25kaXRpb25hbCBzdHJhdGVnaWVzLCBpbmNsdWRpbmcgdGhlIHByb3ZpZGVkIHN0cmF0ZWdpZXMsIHJlbHkgb24gdGhpcyBicm93c2VyIGNvb2tpZSB0byBzdG9yZSB0aGUgcnVuIGlkIGFuZCBoZWxwIG1ha2UgdGhlIGRlY2lzaW9uIG9mIHdoZXRoZXIgdG8gY3JlYXRlIGEgbmV3IHJ1biBvciB1c2UgYW4gZXhpc3Rpbmcgb25lLiBUaGUgbmFtZSBvZiB0aGlzIGNvb2tpZSBkZWZhdWx0cyB0byBgZXBpY2VudGVyLXNjZW5hcmlvYCBhbmQgY2FuIGJlIHNldCB3aXRoIHRoZSBgc2Vzc2lvbktleWAgcGFyYW1ldGVyLlxuKlxuKlxuKiBBZnRlciBpbnN0YW50aWF0aW5nIGEgUnVuIE1hbmFnZXIsIG1ha2UgYSBjYWxsIHRvIGBnZXRSdW4oKWAgd2hlbmV2ZXIgeW91IG5lZWQgdG8gYWNjZXNzIGEgcnVuIGZvciB0aGlzIGVuZCB1c2VyLiBUaGUgYFJ1bk1hbmFnZXIucnVuYCBjb250YWlucyB0aGUgaW5zdGFudGlhdGVkIFtSdW4gU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykuIFRoZSBSdW4gU2VydmljZSBhbGxvd3MgeW91IHRvIGFjY2VzcyB2YXJpYWJsZXMsIGNhbGwgb3BlcmF0aW9ucywgZXRjLlxuKlxuKiAqKkV4YW1wbGUqKlxuKlxuKiAgICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe1xuKiAgICAgICAgICAgcnVuOiB7XG4qICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4qICAgICAgICAgICAgICAgbW9kZWw6ICdzdXBwbHktY2hhaW4tbW9kZWwuamwnLFxuKiAgICAgICAgICAgICAgIHNlcnZlcjogeyBob3N0OiAnYXBpLmZvcmlvLmNvbScgfVxuKiAgICAgICAgICAgfSxcbiogICAgICAgICAgIHN0cmF0ZWd5OiAnYWx3YXlzLW5ldycsXG4qICAgICAgICAgICBzZXNzaW9uS2V5OiAnZXBpY2VudGVyLXNlc3Npb24nXG4qICAgICAgIH0pO1xuKiAgICAgICBybS5nZXRSdW4oKVxuKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocnVuKSB7XG4qICAgICAgICAgICAgICAgLy8gdGhlIHJldHVybiB2YWx1ZSBvZiBnZXRSdW4oKSBpcyBhIHJ1biBvYmplY3RcbiogICAgICAgICAgICAgICB2YXIgdGhpc1J1bklkID0gcnVuLmlkO1xuKiAgICAgICAgICAgICAgIC8vIHRoZSBSdW5NYW5hZ2VyLnJ1biBhbHNvIGNvbnRhaW5zIHRoZSBpbnN0YW50aWF0ZWQgUnVuIFNlcnZpY2UsXG4qICAgICAgICAgICAgICAgLy8gc28gYW55IFJ1biBTZXJ2aWNlIG1ldGhvZCBpcyB2YWxpZCBoZXJlXG4qICAgICAgICAgICAgICAgcm0ucnVuLmRvKCdydW5Nb2RlbCcpO1xuKiAgICAgICB9KVxuKlxuKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIHN0cmF0ZWdpZXMgPSByZXF1aXJlKCcuL3J1bi1zdHJhdGVnaWVzJyk7XG52YXIgc3BlY2lhbE9wZXJhdGlvbnMgPSByZXF1aXJlKCcuL3NwZWNpYWwtb3BlcmF0aW9ucycpO1xudmFyIFJ1blNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciB1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpO1xudmFyIGtleU5hbWVzID0gcmVxdWlyZSgnLi9rZXktbmFtZXMnKTtcblxuZnVuY3Rpb24gcGF0Y2hSdW5TZXJ2aWNlKHNlcnZpY2UsIG1hbmFnZXIpIHtcbiAgICBpZiAoc2VydmljZS5wYXRjaGVkKSB7XG4gICAgICAgIHJldHVybiBzZXJ2aWNlO1xuICAgIH1cblxuICAgIHZhciBvcmlnID0gc2VydmljZS5kbztcbiAgICBzZXJ2aWNlLmRvID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcGFyYW1zLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciByZXNlcnZlZE9wcyA9IE9iamVjdC5rZXlzKHNwZWNpYWxPcGVyYXRpb25zKTtcbiAgICAgICAgaWYgKHJlc2VydmVkT3BzLmluZGV4T2Yob3BlcmF0aW9uKSA9PT0gLTEpIHtcbiAgICAgICAgICAgIHJldHVybiBvcmlnLmFwcGx5KHNlcnZpY2UsIGFyZ3VtZW50cyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gc3BlY2lhbE9wZXJhdGlvbnNbb3BlcmF0aW9uXS5jYWxsKHNlcnZpY2UsIHBhcmFtcywgb3B0aW9ucywgbWFuYWdlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VydmljZS5wYXRjaGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiBzZXJ2aWNlO1xufVxuXG5mdW5jdGlvbiBzZXRSdW5JblNlc3Npb24oc2Vzc2lvbktleSwgcnVuaWQsIHNlc3Npb25NYW5hZ2VyKSB7XG4gICAgaWYgKHNlc3Npb25LZXkpIHtcbiAgICAgICAgLy9UT0RPOiBQdXQgdGhlIGVudGlyZSAgcnVub2JqZWN0IGluIHNlc3Npb24/IFRoaXMnbGwgaGVscCB0aGluZ3MgbGlrZSB0aGUgYmFzZWxpbmUgc3RyYXRlZ3kgZGV0ZXJtaW5lIGlmIGl0J3MgZ29vZCBlbm91Z2ggd2l0aG91dCBtYWtpbmcgYW4gYWpheCBjYWxsXG4gICAgICAgIHNlc3Npb25NYW5hZ2VyLmdldFN0b3JlKCkuc2V0KHNlc3Npb25LZXksIEpTT04uc3RyaW5naWZ5KHsgcnVuSWQ6IHJ1bmlkIH0pKTtcbiAgICB9XG59XG5cbnZhciBkZWZhdWx0cyA9IHtcbiAgICBzZXNzaW9uS2V5OiBrZXlOYW1lcy5TVFJBVEVHWV9TRVNTSU9OX0tFWSxcblxuICAgIC8qKlxuICAgICAqIFJ1biBjcmVhdGlvbiBzdHJhdGVneSBmb3Igd2hlbiB0byBjcmVhdGUgYSBuZXcgcnVuIGFuZCB3aGVuIHRvIHJldXNlIGFuIGVuZCB1c2VyJ3MgZXhpc3RpbmcgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uL3N0cmF0ZWdpZXMvKSBmb3IgZGV0YWlscy4gRGVmYXVsdHMgdG8gYG5ldy1pZi1pbml0aWFsaXplZGAuXG4gICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgKi9cbiAgICBzdHJhdGVneTogJ25ldy1pZi1pbml0aWFsaXplZCdcbn07XG5cbmZ1bmN0aW9uIFJ1bk1hbmFnZXIob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgdGhpcy5ydW4gPSB0aGlzLm9wdGlvbnMucnVuO1xuICAgIH0gZWxzZSBpZiAodGhpcy5vcHRpb25zLnJ1bikge1xuICAgICAgICB0aGlzLnJ1biA9IG5ldyBSdW5TZXJ2aWNlKHRoaXMub3B0aW9ucy5ydW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gcnVuIG9wdGlvbnMgcGFzc2VkIHRvIFJ1bk1hbmFnZXInKTtcbiAgICB9XG4gICAgcGF0Y2hSdW5TZXJ2aWNlKHRoaXMucnVuLCB0aGlzKTtcblxuICAgIHZhciBTdHJhdGVneUN0b3IgPSB0eXBlb2YgdGhpcy5vcHRpb25zLnN0cmF0ZWd5ID09PSAnZnVuY3Rpb24nID8gdGhpcy5vcHRpb25zLnN0cmF0ZWd5IDogc3RyYXRlZ2llcy5nZXQodGhpcy5vcHRpb25zLnN0cmF0ZWd5KTtcbiAgICBpZiAoIVN0cmF0ZWd5Q3Rvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NwZWNpZmllZCBydW4gY3JlYXRpb24gc3RyYXRlZ3kgd2FzIGludmFsaWQ6JywgdGhpcy5vcHRpb25zLnN0cmF0ZWd5KTtcbiAgICB9XG4gICAgdmFyIHN0cmF0ZWd5ID0gbmV3IFN0cmF0ZWd5Q3Rvcih0aGlzLm9wdGlvbnMpO1xuICAgIGlmICghc3RyYXRlZ3kuZ2V0UnVuIHx8ICFzdHJhdGVneS5yZXNldCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FsbCBzdHJhdGVnaWVzIHNob3VsZCBpbXBsZW1lbnQgYSBgZ2V0UnVuYCBhbmQgYHJlc2V0YCBpbnRlcmZhY2UnLCB0aGlzLm9wdGlvbnMuc3RyYXRlZ3kpO1xuICAgIH1cbiAgICBzdHJhdGVneS5yZXF1aXJlc0F1dGggPSBTdHJhdGVneUN0b3IucmVxdWlyZXNBdXRoO1xuICAgIHRoaXMuc3RyYXRlZ3kgPSBzdHJhdGVneTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIodGhpcy5vcHRpb25zKTtcbn1cblxuUnVuTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgLyoqXG4gICAgICogUmV0dXJucyB0aGUgcnVuIG9iamVjdCBmb3IgYSAnZ29vZCcgcnVuLlxuICAgICAqXG4gICAgICogQSBnb29kIHJ1biBpcyBkZWZpbmVkIGJ5IHRoZSBzdHJhdGVneS4gRm9yIGV4YW1wbGUsIGlmIHRoZSBzdHJhdGVneSBpcyBgYWx3YXlzLW5ld2AsIHRoZSBjYWxsXG4gICAgICogdG8gYGdldFJ1bigpYCBhbHdheXMgcmV0dXJucyBhIG5ld2x5IGNyZWF0ZWQgcnVuOyBpZiB0aGUgc3RyYXRlZ3kgaXMgYG5ldy1pZi1wZXJzaXN0ZWRgLFxuICAgICAqIGBnZXRSdW4oKWAgY3JlYXRlcyBhIG5ldyBydW4gaWYgdGhlIHByZXZpb3VzIHJ1biBpcyBpbiBhIHBlcnNpc3RlZCBzdGF0ZSwgb3RoZXJ3aXNlXG4gICAgICogaXQgcmV0dXJucyB0aGUgcHJldmlvdXMgcnVuLiBTZWUgW1J1biBNYW5hZ2VyIFN0cmF0ZWdpZXNdKC4uL3N0cmF0ZWdpZXMvKSBmb3IgbW9yZSBvbiBzdHJhdGVnaWVzLlxuICAgICAqXG4gICAgICogICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIHJtLmdldFJ1bigpLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgcnVuIG9iamVjdFxuICAgICAqICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJtLnJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogQHBhcmFtIHtBcnJheX0gdmFyaWFibGVzIChPcHRpb25hbCkgaWYgcHJvdmlkZWQgaXQnbGwgcG9wdWxhdGUgdGhlIHJ1biBpdCBnZXRzIHdpdGggdGhlIHByb3ZpZGVkIHZhcmlhYmxlcy5cbiAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIHRoZXNlIHdpbGwgYmUgcGFzc2VkIG9uIHRvIFJ1blNlcnZpY2UjY3JlYXRlIGlmIHRoZSBzdHJhdGVneSBkb2VzIGNyZWF0ZSBhIG5ldyBydW5cbiAgICAgKiBAcmV0dXJuIHskcHJvbWlzZX0gUHJvbWlzZSB0byBjb21wbGV0ZSB0aGUgY2FsbC5cbiAgICAgKi9cbiAgICBnZXRSdW46IGZ1bmN0aW9uICh2YXJpYWJsZXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIHNlc3Npb25TdG9yZSA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0U3RvcmUoKTtcbiAgICAgICAgdmFyIHJ1blNlc3Npb24gPSBKU09OLnBhcnNlKHNlc3Npb25TdG9yZS5nZXQodGhpcy5vcHRpb25zLnNlc3Npb25LZXkpIHx8ICd7fScpO1xuICAgICAgICB2YXIgcnVuaWQgPSBydW5TZXNzaW9uICYmIHJ1blNlc3Npb24ucnVuSWQ7XG5cbiAgICAgICAgdmFyIGF1dGhTZXNzaW9uID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRTZXNzaW9uKCk7XG4gICAgICAgIGlmICh0aGlzLnN0cmF0ZWd5LnJlcXVpcmVzQXV0aCAmJiB1dGlsLmlzRW1wdHkoYXV0aFNlc3Npb24pKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdObyB1c2VyLXNlc3Npb24gYXZhaWxhYmxlJywgdGhpcy5vcHRpb25zLnN0cmF0ZWd5LCAncmVxdWlyZXMgYXV0aGVudGljYXRpb24uJyk7XG4gICAgICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdCgnTm8gdXNlci1zZXNzaW9uIGF2YWlsYWJsZScpLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5zdHJhdGVneVxuICAgICAgICAgICAgICAgIC5nZXRSdW4odGhpcy5ydW4sIGF1dGhTZXNzaW9uLCBydW5pZCwgb3B0aW9ucykudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChydW4gJiYgcnVuLmlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXRSdW5JblNlc3Npb24obWUub3B0aW9ucy5zZXNzaW9uS2V5LCBydW4uaWQsIG1lLnNlc3Npb25NYW5hZ2VyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1lLnJ1bi51cGRhdGVDb25maWcoeyBmaWx0ZXI6IHJ1bi5pZCB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhcmlhYmxlcyAmJiB2YXJpYWJsZXMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJ1bi52YXJpYWJsZXMoKS5xdWVyeSh2YXJpYWJsZXMpLnRoZW4oZnVuY3Rpb24gKHJlc3VsdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcnVuLnZhcmlhYmxlcyA9IHJlc3VsdHM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW4udmFyaWFibGVzID0ge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBSZXR1cm5zIHRoZSBydW4gb2JqZWN0IGZvciBhIG5ldyBydW4sIHJlZ2FyZGxlc3Mgb2Ygc3RyYXRlZ3k6IGZvcmNlIGNyZWF0aW9uIG9mIGEgbmV3IHJ1bi5cbiAgICAgKlxuICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAqXG4gICAgICogICAgICBybS5yZXNldCgpLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAqICAgICAgICAgIC8vIHVzZSB0aGUgKG5ldykgcnVuIG9iamVjdFxuICAgICAqICAgICAgICAgIHZhciB0aGlzUnVuSWQgPSBydW4uaWQ7XG4gICAgICpcbiAgICAgKiAgICAgICAgICAvLyB1c2UgdGhlIFJ1biBTZXJ2aWNlIG9iamVjdFxuICAgICAqICAgICAgICAgIHJtLnJ1bi5kbygncnVuTW9kZWwnKTtcbiAgICAgKiAgICAgIH0pO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAqL1xuICAgIHJlc2V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgYXV0aFNlc3Npb24gPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldFNlc3Npb24oKTtcbiAgICAgICAgaWYgKHRoaXMuc3RyYXRlZ3kucmVxdWlyZXNBdXRoICYmIHV0aWwuaXNFbXB0eShhdXRoU2Vzc2lvbikpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ05vIHVzZXItc2Vzc2lvbiBhdmFpbGFibGUnLCB0aGlzLm9wdGlvbnMuc3RyYXRlZ3ksICdyZXF1aXJlcyBhdXRoZW50aWNhdGlvbi4nKTtcbiAgICAgICAgICAgIHJldHVybiAkLkRlZmVycmVkKCkucmVqZWN0KCdObyB1c2VyLXNlc3Npb24gYXZhaWxhYmxlJykucHJvbWlzZSgpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLnN0cmF0ZWd5LnJlc2V0KHRoaXMucnVuLCBhdXRoU2Vzc2lvbiwgb3B0aW9ucykudGhlbihmdW5jdGlvbiAocnVuKSB7XG4gICAgICAgICAgICBpZiAocnVuICYmIHJ1bi5pZCkge1xuICAgICAgICAgICAgICAgIHNldFJ1bkluU2Vzc2lvbihtZS5vcHRpb25zLnNlc3Npb25LZXksIHJ1bi5pZCwgbWUuc2Vzc2lvbk1hbmFnZXIpO1xuICAgICAgICAgICAgICAgIG1lLnJ1bi51cGRhdGVDb25maWcoeyBmaWx0ZXI6IHJ1bi5pZCB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBydW47XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cblJ1bk1hbmFnZXIuc3RyYXRlZ2llcyA9IHN0cmF0ZWdpZXM7XG5tb2R1bGUuZXhwb3J0cyA9IFJ1bk1hbmFnZXI7XG4iLCIvKipcbiAqIFRoZSBgYWx3YXlzLW5ld2Agc3RyYXRlZ3kgYWx3YXlzIGNyZWF0ZXMgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyIGlycmVzcGVjdGl2ZSBvZiBjdXJyZW50IHN0YXRlLiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gY2FsbGluZyBgRi5zZXJ2aWNlLlJ1bi5jcmVhdGUoKWAgZnJvbSB0aGUgW1J1biBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSBldmVyeSB0aW1lLiBcbiAqIFxuICogVGhpcyBzdHJhdGVneSBtZWFucyB0aGF0IGV2ZXJ5IHRpbWUgeW91ciBlbmQgdXNlcnMgcmVmcmVzaCB0aGVpciBicm93c2VycywgdGhleSBnZXQgYSBuZXcgcnVuLiBcbiAqIFxuICogVGhpcyBzdHJhdGVneSBjYW4gYmUgdXNlZnVsIGZvciBiYXNpYywgc2luZ2xlLXBhZ2UgcHJvamVjdHMuIFRoaXMgc3RyYXRlZ3kgaXMgYWxzbyB1c2VmdWwgZm9yIHByb3RvdHlwaW5nIG9yIHByb2plY3QgZGV2ZWxvcG1lbnQ6IGl0IGNyZWF0ZXMgYSBuZXcgcnVuIGVhY2ggdGltZSB5b3UgcmVmcmVzaCB0aGUgcGFnZSwgYW5kIHlvdSBjYW4gZWFzaWx5IGNoZWNrIHRoZSBvdXRwdXRzIG9mIHRoZSBtb2RlbC4gSG93ZXZlciwgdHlwaWNhbGx5IHlvdSB3aWxsIHVzZSBvbmUgb2YgdGhlIG90aGVyIHN0cmF0ZWdpZXMgZm9yIGEgcHJvZHVjdGlvbiBwcm9qZWN0LlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIENvbmRpdGlvbmFsU3RyYXRlZ3kgPSByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5Jyk7XG5cbnZhciBfX3N1cGVyID0gQ29uZGl0aW9uYWxTdHJhdGVneS5wcm90b3R5cGU7XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShDb25kaXRpb25hbFN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIF9fc3VwZXIuY29uc3RydWN0b3IuY2FsbCh0aGlzLCB0aGlzLmNyZWF0ZUlmLCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgY3JlYXRlSWY6IGZ1bmN0aW9uIChydW4sIGhlYWRlcnMpIHtcbiAgICAgICAgLy8gYWx3YXlzIGNyZWF0ZSBhIG5ldyBydW4hXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vbm9uZS1zdHJhdGVneScpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xuXG4vKipcbiogQ29uZGl0aW9uYWwgQ3JlYXRpb24gU3RyYXRlZ3lcbiogVGhpcyBzdHJhdGVneSB3aWxsIHRyeSB0byBnZXQgdGhlIHJ1biBzdG9yZWQgaW4gdGhlIGNvb2tpZSBhbmRcbiogZXZhbHVhdGUgaWYgbmVlZHMgdG8gY3JlYXRlIGEgbmV3IHJ1biBieSBjYWxsaW5nIHRoZSAnY29uZGl0aW9uJyBmdW5jdGlvblxuKi9cblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gU3RyYXRlZ3koY29uZGl0aW9uKSB7XG4gICAgICAgIGlmIChjb25kaXRpb24gPT0gbnVsbCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIC8vVE9ETzogbm90IHN1cmUgd2h5IHRoaXMgaXMgZXhwbGljaXRseSA9PVxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDb25kaXRpb25hbCBzdHJhdGVneSBuZWVkcyBhIGNvbmRpdGlvbiB0byBjcmVhdGUgYSBydW4nKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmNvbmRpdGlvbiA9IHR5cGVvZiBjb25kaXRpb24gIT09ICdmdW5jdGlvbicgPyBmdW5jdGlvbiAoKSB7IHJldHVybiBjb25kaXRpb247IH0gOiBjb25kaXRpb247XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIFJlc2V0cyBjdXJyZW50IHJ1blxuICAgICAqIEBwYXJhbSAge1J1blNlcnZpY2V9IHJ1blNlcnZpY2UgIGEgUnVuIFNlcnZpY2UgaW5zdGFuY2UgZm9yIHRoZSAnY3VycmVudCBydW4nIGFzIGRldGVybWluZWQgYnkgdGhlIFJ1biBNYW5hZ2VyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSB1c2VyU2Vzc2lvbiBJbmZvcm1hdGlvbiBhYm91dCB0aGUgY3VycmVudCB1c2VyIHNlZXNpb24uIFNlZSBBdXRoTWFuYWdlciNnZXRDdXJyZW50VXNlclNlc3Npb24gZm9yIGZvcm1hdFxuICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIFNlZSBSdW5TZXJ2aWNlI2NyZWF0ZSBmb3Igc3VwcG9ydGVkIG9wdGlvbnNcbiAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSAgICAgICAgICAgICBcbiAgICAgKi9cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBncm91cCA9IHVzZXJTZXNzaW9uICYmIHVzZXJTZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIHNjb3BlOiB7IGdyb3VwOiBncm91cCB9XG4gICAgICAgIH0sIHJ1blNlcnZpY2UuZ2V0Q3VycmVudENvbmZpZygpKTtcblxuICAgICAgICByZXR1cm4gcnVuU2VydmljZVxuICAgICAgICAgICAgICAgIC5jcmVhdGUob3B0LCBvcHRpb25zKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgcnVuLmZyZXNobHlDcmVhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogR2V0cyB0aGUgJ2NvcnJlY3QnIHJ1biAodGhlIGRlZmluaXRpb24gb2YgJ2N1cnJlY3QnIGRlcGVuZHMgb24gc3RyYXRlZ3kgaW1wbGVtZW50YXRpb24pXG4gICAgICogQHBhcmFtICB7UnVuU2VydmljZX0gcnVuU2VydmljZSAgYSBSdW4gU2VydmljZSBpbnN0YW5jZSBmb3IgdGhlICdjdXJyZW50IHJ1bicgYXMgZGV0ZXJtaW5lZCBieSB0aGUgUnVuIE1hbmFnZXJcbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHVzZXJTZXNzaW9uIEluZm9ybWF0aW9uIGFib3V0IHRoZSBjdXJyZW50IHVzZXIgc2Vlc2lvbi4gU2VlIEF1dGhNYW5hZ2VyI2dldEN1cnJlbnRVc2VyU2Vzc2lvbiBmb3IgZm9ybWF0XG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBydW5JZEluU2Vzc2lvbiB0aGUgUnVuTWFuYWdlciBzdG9yZXMgdGhlICdsYXN0IGFjY2Vzc2VkJyBydW4gaW4gYSBjb29raWU7ICB0aGlzIHJlZmVycyB0byB0aGUgbGFzdC11c2VkIHJ1bmlkXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgU2VlIFJ1blNlcnZpY2UjY3JlYXRlIGZvciBzdXBwb3J0ZWQgb3B0aW9uc1xuICAgICAqIEByZXR1cm4ge1Byb21pc2V9ICAgICAgICAgICAgIFxuICAgICAqL1xuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBydW5JZEluU2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBpZiAocnVuSWRJblNlc3Npb24pIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxvYWRBbmRDaGVjayhydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuSWRJblNlc3Npb24sIG9wdGlvbnMpLmNhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWUucmVzZXQocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpOyAvL2lmIGl0IGdvdCB0aGUgd3JvbmcgY29va2llIGZvciBlLmcuXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJlc2V0KHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBsb2FkQW5kQ2hlY2s6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuSWRJblNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHNob3VsZENyZWF0ZSA9IGZhbHNlO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgIHJldHVybiBydW5TZXJ2aWNlXG4gICAgICAgICAgICAubG9hZChydW5JZEluU2Vzc2lvbiwgbnVsbCwge1xuICAgICAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgICAgICBzaG91bGRDcmVhdGUgPSBtZS5jb25kaXRpb24ocnVuLCBoZWFkZXJzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIGlmIChzaG91bGRDcmVhdGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJlc2V0KHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmF0ZWd5O1xuIiwidmFyIGxpc3QgPSB7XG4gICAgJ25ldy1pZi1pbml0aWFsaXplZCc6IHJlcXVpcmUoJy4vbmV3LWlmLWluaXRpYWxpemVkLXN0cmF0ZWd5JyksXG4gICAgJ25ldy1pZi1wZXJzaXN0ZWQnOiByZXF1aXJlKCcuL25ldy1pZi1wZXJzaXN0ZWQtc3RyYXRlZ3knKSxcbiAgICAnbmV3LWlmLW1pc3NpbmcnOiByZXF1aXJlKCcuL25ldy1pZi1taXNzaW5nLXN0cmF0ZWd5JyksXG4gICAgJ2Fsd2F5cy1uZXcnOiByZXF1aXJlKCcuL2Fsd2F5cy1uZXctc3RyYXRlZ3knKSxcbiAgICBtdWx0aXBsYXllcjogcmVxdWlyZSgnLi9tdWx0aXBsYXllci1zdHJhdGVneScpLFxuICAgICdwZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXInOiByZXF1aXJlKCcuL3BlcnNpc3RlbnQtc2luZ2xlLXBsYXllci1zdHJhdGVneScpLFxuICAgIG5vbmU6IHJlcXVpcmUoJy4vbm9uZS1zdHJhdGVneScpLFxuICAgIGJhc2VsaW5lOiByZXF1aXJlKCcuLi9zY2VuYXJpby1zdHJhdGVnaWVzL2Jhc2VsaW5lLXN0cmF0ZWd5JyksXG4gICAgJ25ldy1pZi1zdGVwcGVkJzogcmVxdWlyZSgnLi4vc2NlbmFyaW8tc3RyYXRlZ2llcy9sYXN0LXVuc2F2ZWQnKSxcbiAgICAnY29uZGl0aW9uYWwtY3JlYXRpb24nOiByZXF1aXJlKCcuL2NvbmRpdGlvbmFsLWNyZWF0aW9uLXN0cmF0ZWd5JyksXG4gICAgJ3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQnOiByZXF1aXJlKCcuL3JldXNlLWxhc3QtaW5pdGlhbGl6ZWQnKSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8qKlxuICAgICAqIExpc3QgYXZhaWxhYmxlIHN0cmF0ZWdpZXNcbiAgICAgKiBAdHlwZSB7T2JqZWN0fSBrZXkgaXMgc3RyYXRlZ3kgbmFtZSBhbmQgdmFsdWUgaXMgdGhlIHN0cmF0ZWd5IGNvbnN0cnVjdG9yXG4gICAgICovXG4gICAgbGlzdDogbGlzdCxcblxuICAgIC8qKlxuICAgICAqIEdldCBzdHJhdGVneSBieSBuYW1lXG4gICAgICogQHBhcmFtICB7U3RyaW5nfSBzdHJhdGVneU5hbWUgTmFtZSBvZiBzdHJhdGVneSB0byBnZXRcbiAgICAgKiBAcmV0dXJuIHtGdW5jdGlvbn0gICAgICAgICAgICAgIFN0cmF0ZWd5IGZ1bmN0aW9uXG4gICAgICovXG4gICAgZ2V0OiBmdW5jdGlvbiAoc3RyYXRlZ3lOYW1lKSB7XG4gICAgICAgIHJldHVybiBsaXN0W3N0cmF0ZWd5TmFtZV07XG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEFkZHMgYSBuZXcgc3RyYXRlZ3lcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IG5hbWUgICAgIE5hbWUgZm9yIHN0cmF0ZWd5LiBUaGlzIHN0cmluZyBjYW4gdGhlbiBiZSBwYXNzZWQgdG8gYSBSdW5NYW5hZ2VyIGFzIGBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoeyBzY2VuYXJpbzogJ215bmV3bmFtZSd9KWBcbiAgICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gc3RyYXRlZ3kgWW91ciBzdHJhdGVneSBjb25zdHJ1Y3Rvci4gV2lsbCBiZSBjYWxsZWQgd2l0aCBgbmV3YCBvbiBSdW5NYW5hZ2VyIGluaXRpYWxpemF0aW9uXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zICBPcHRpb25zIGZvciBzdHJhdGVneVxuICAgICAqIEBwYXJhbSAge0Jvb2xlYW59IG9wdGlvbnMucmVxdWlyZXNBdXRoIFNwZWNpZnkgaWYgdGhlIHN0cmF0ZWd5IHJlcXVpcmVzIGFuIHZhbGlkIHVzZXItc2Vzc2lvbiB0byB3b3JrXG4gICAgICovXG4gICAgcmVnaXN0ZXI6IGZ1bmN0aW9uIChuYW1lLCBzdHJhdGVneSwgb3B0aW9ucykge1xuICAgICAgICBzdHJhdGVneS5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgbGlzdFtuYW1lXSA9IHN0cmF0ZWd5O1xuICAgIH1cbn07IiwiLyoqXG4gKiBUaGUgYG11bHRpcGxheWVyYCBzdHJhdGVneSBpcyBmb3IgdXNlIHdpdGggW211bHRpcGxheWVyIHdvcmxkc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS4gSXQgY2hlY2tzIHRoZSBjdXJyZW50IHdvcmxkIGZvciB0aGlzIGVuZCB1c2VyLCBhbmQgYWx3YXlzIHJldHVybnMgdGhlIGN1cnJlbnQgcnVuIGZvciB0aGF0IHdvcmxkLiBUaGlzIGlzIGVxdWl2YWxlbnQgdG8gY2FsbGluZyBgZ2V0Q3VycmVudFdvcmxkRm9yVXNlcigpYCBhbmQgdGhlbiBgZ2V0Q3VycmVudFJ1bklkKClgIGZyb20gdGhlIFtXb3JsZCBBUEkgQWRhcGF0ZXJdKC4uL3dvcmxkLWFwaS1hZGFwdGVyLykuXG4gKiBcbiAqIFVzaW5nIHRoaXMgc3RyYXRlZ3kgbWVhbnMgdGhhdCBlbmQgdXNlcnMgaW4gcHJvamVjdHMgd2l0aCBtdWx0aXBsYXllciB3b3JsZHMgYWx3YXlzIHNlZSB0aGUgbW9zdCBjdXJyZW50IHJ1biBhbmQgd29ybGQuIFRoaXMgZW5zdXJlcyB0aGF0IHRoZXkgYXJlIGluIHN5bmMgd2l0aCB0aGUgb3RoZXIgZW5kIHVzZXJzIHNoYXJpbmcgdGhlaXIgd29ybGQgYW5kIHJ1bi4gSW4gdHVybiwgdGhpcyBhbGxvd3MgZm9yIGNvbXBldGl0aXZlIG9yIGNvbGxhYm9yYXRpdmUgbXVsdGlwbGF5ZXIgcHJvamVjdHMuXG4gKi9cbid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xuXG52YXIgSWRlbnRpdHlTdHJhdGVneSA9IHJlcXVpcmUoJy4vbm9uZS1zdHJhdGVneScpO1xudmFyIFdvcmxkQXBpQWRhcHRlciA9IHJlcXVpcmUoJy4uLy4uL3NlcnZpY2Uvd29ybGQtYXBpLWFkYXB0ZXInKTtcblxudmFyIGRlZmF1bHRzID0ge307XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMud29ybGRBcGkgPSBuZXcgV29ybGRBcGlBZGFwdGVyKHRoaXMub3B0aW9ucy5ydW4pO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHNlc3Npb24pIHtcbiAgICAgICAgdmFyIGN1clVzZXJJZCA9IHNlc3Npb24udXNlcklkO1xuICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGlcbiAgICAgICAgICAgIC5nZXRDdXJyZW50V29ybGRGb3JVc2VyKGN1clVzZXJJZCwgY3VyR3JvdXBOYW1lKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMud29ybGRBcGkubmV3UnVuRm9yV29ybGQod29ybGQuaWQpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuU2VydmljZSwgc2Vzc2lvbikge1xuICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgIHZhciBjdXJHcm91cE5hbWUgPSBzZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgdmFyIHdvcmxkQXBpID0gdGhpcy53b3JsZEFwaTtcbiAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5vcHRpb25zLm1vZGVsO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgIGlmICghY3VyVXNlcklkKSB7XG4gICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCh7IHN0YXR1c0NvZGU6IDQwMCwgZXJyb3I6ICdXZSBuZWVkIGFuIGF1dGhlbnRpY2F0ZWQgdXNlciB0byBqb2luIGEgbXVsdGlwbGF5ZXIgd29ybGQuIChFUlI6IG5vIHVzZXJJZCBpbiBzZXNzaW9uKScgfSwgc2Vzc2lvbikucHJvbWlzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGxvYWRSdW5Gcm9tV29ybGQgPSBmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgIGlmICghd29ybGQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZHRkLnJlamVjdCh7IHN0YXR1c0NvZGU6IDQwNCwgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgaW4gYW55IHdvcmxkLicgfSwgeyBvcHRpb25zOiBtZS5vcHRpb25zLCBzZXNzaW9uOiBzZXNzaW9uIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZC5pZCB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuU2VydmljZS5sb2FkKGlkKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGR0ZC5yZXNvbHZlKVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBzZXJ2ZXJFcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgLy8gaXMgdGhpcyBwb3NzaWJsZT9cbiAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KGVycm9yLCBzZXNzaW9uLCBtZS5vcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLndvcmxkQXBpXG4gICAgICAgICAgICAuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcihjdXJVc2VySWQsIGN1ckdyb3VwTmFtZSlcbiAgICAgICAgICAgIC50aGVuKGxvYWRSdW5Gcm9tV29ybGQpXG4gICAgICAgICAgICAuZmFpbChzZXJ2ZXJFcnJvcik7XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfSxcblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIvKipcbiAqIFRoZSBgbmV3LWlmLWluaXRpYWxpemVkYCBzdHJhdGVneSBjcmVhdGVzIGEgbmV3IHJ1biBpZiB0aGUgY3VycmVudCBvbmUgaXMgaW4gbWVtb3J5IG9yIGhhcyBpdHMgYGluaXRpYWxpemVkYCBmaWVsZCBzZXQgdG8gYHRydWVgLiBUaGUgYGluaXRpYWxpemVkYCBmaWVsZCBpbiB0aGUgcnVuIHJlY29yZCBpcyBhdXRvbWF0aWNhbGx5IHNldCB0byBgdHJ1ZWAgYXQgcnVuIGNyZWF0aW9uIGZvciBWZW5zaW0gbW9kZWxzOyBpdCBjYW4gYmUgc2V0IG1hbnVhbGx5IGZvciBvdGhlciBtb2RlbHMuXG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGlmIHlvdXIgcHJvamVjdCBpcyBzdHJ1Y3R1cmVkIHN1Y2ggdGhhdCBpbW1lZGlhdGVseSBhZnRlciBhIHJ1biBpcyBjcmVhdGVkLCB0aGUgbW9kZWwgaXMgZXhlY3V0ZWQgY29tcGxldGVseSAoZm9yIGV4YW1wbGUsIGEgVmVuc2ltIG1vZGVsIGlzIHN0ZXBwZWQgdG8gdGhlIGVuZCkuIEl0IGlzIHNpbWlsYXIgdG8gdGhlIGBuZXctaWYtbWlzc2luZ2Agc3RyYXRlZ3ksIGV4Y2VwdCB0aGF0IGl0IGNoZWNrcyBhIGZpZWxkIG9mIHRoZSBydW4gcmVjb3JkLlxuICogXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqXG4gKiAqIENoZWNrIHRoZSBgc2Vzc2lvbktleWAgY29va2llLiBcbiAqICAqIFRoaXMgY29va2llIGlzIHNldCBieSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGFuZCBjb25maWd1cmFibGUgdGhyb3VnaCBpdHMgb3B0aW9ucy5cbiAqICAqIElmIHRoZSBjb29raWUgZXhpc3RzLCBjaGVjayB3aGV0aGVyIHRoZSBydW4gaXMgaW4gbWVtb3J5IG9yIG9ubHkgcGVyc2lzdGVkIGluIHRoZSBkYXRhYmFzZS4gQWRkaXRpb25hbGx5LCBjaGVjayB3aGV0aGVyIHRoZSBydW4ncyBgaW5pdGlhbGl6ZWRgIGZpZWxkIGlzIGB0cnVlYC4gXG4gKiAgICAgICogSWYgdGhlIHJ1biBpcyBpbiBtZW1vcnksIGNyZWF0ZSBhIG5ldyBydW4uXG4gKiAgICAgICogSWYgdGhlIHJ1bidzIGBpbml0aWFsaXplZGAgZmllbGQgaXMgYHRydWVgLCBjcmVhdGUgYSBuZXcgcnVuLlxuICogICAgICAqIE90aGVyd2lzZSwgdXNlIHRoZSBleGlzdGluZyBydW4uXG4gKiAgKiBJZiB0aGUgY29va2llIGRvZXMgbm90IGV4aXN0LCBjcmVhdGUgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyLlxuICovXG5cbid1c2Ugc3RyaWN0JztcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBDb25kaXRpb25hbFN0cmF0ZWd5ID0gcmVxdWlyZSgnLi9jb25kaXRpb25hbC1jcmVhdGlvbi1zdHJhdGVneScpO1xuXG52YXIgX19zdXBlciA9IENvbmRpdGlvbmFsU3RyYXRlZ3kucHJvdG90eXBlO1xuXG52YXIgU3RyYXRlZ3kgPSBjbGFzc0Zyb20oQ29uZGl0aW9uYWxTdHJhdGVneSwge1xuICAgIGNvbnN0cnVjdG9yOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBfX3N1cGVyLmNvbnN0cnVjdG9yLmNhbGwodGhpcywgdGhpcy5jcmVhdGVJZiwgb3B0aW9ucyk7XG4gICAgICAgIGNvbnNvbGUud2FybignVGhpcyBzdHJhdGVneSBpcyBkZXByZWNhdGVkOyBhbGwgcnVucyBub3cgZGVmYXVsdCB0byBiZWluZyBpbml0aWFsaXplZCBieSBkZWZhdWx0IG1ha2luZyB0aGlzIHJlZHVuZGFudC4gQ29uc2lkZXIgdXNpbmcgYHJldXNlLWxhc3QtaW5pdGlhbGl6ZWRgIGluc3RlYWQuJyk7XG4gICAgfSxcblxuICAgIGNyZWF0ZUlmOiBmdW5jdGlvbiAocnVuLCBoZWFkZXJzKSB7XG4gICAgICAgIHJldHVybiBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnIHx8IHJ1bi5pbml0aWFsaXplZDtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogVGhlIGBuZXctaWYtbWlzc2luZ2Agc3RyYXRlZ3kgY3JlYXRlcyBhIG5ldyBydW4gd2hlbiB0aGUgY3VycmVudCBvbmUgaXMgbm90IGluIHRoZSBicm93c2VyIGNvb2tpZS5cbiAqIFxuICogVXNpbmcgdGhpcyBzdHJhdGVneSBtZWFucyB0aGF0IHdoZW4gZW5kIHVzZXJzIG5hdmlnYXRlIGJldHdlZW4gcGFnZXMgaW4geW91ciBwcm9qZWN0LCBvciByZWZyZXNoIHRoZWlyIGJyb3dzZXJzLCB0aGV5IHdpbGwgc3RpbGwgYmUgd29ya2luZyB3aXRoIHRoZSBzYW1lIHJ1bi5cbiAqXG4gKiBUaGlzIHN0cmF0ZWd5IGlzIHVzZWZ1bCBpZiB5b3VyIHByb2plY3QgaXMgc3RydWN0dXJlZCBzdWNoIHRoYXQgaW1tZWRpYXRlbHkgYWZ0ZXIgYSBydW4gaXMgY3JlYXRlZCwgdGhlIG1vZGVsIGlzIGV4ZWN1dGVkIGNvbXBsZXRlbHkgKGZvciBleGFtcGxlLCBhIFZlbnNpbSBtb2RlbCB0aGF0IGlzIHN0ZXBwZWQgdG8gdGhlIGVuZCBhcyBzb29uIGFzIGl0IGlzIGNyZWF0ZWQpLiBJbiBvdGhlciB3b3JkcywgeW91IGNhcmUgd2hldGhlciB5b3UgaGF2ZSBhIHJ1biwgYnV0IGFzIGxvbmcgYXMgeW91IGhhdmUgb25lLCB5b3UgYXJlIGNlcnRhaW4gdGhhdCB0aGlzIHJ1biBpcyB0aGUgb25lIHlvdSBhcmUgaW50ZXJlc3RlZCBpbi4gXG4gKiBcbiAqIFNwZWNpZmljYWxseSwgdGhlIHN0cmF0ZWd5IGlzOlxuICpcbiAqICogQ2hlY2sgdGhlIGBzZXNzaW9uS2V5YCBjb29raWUuXG4gKiAgICAgKiBUaGlzIGNvb2tpZSBpcyBzZXQgYnkgdGhlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBhbmQgY29uZmlndXJhYmxlIHRocm91Z2ggaXRzIG9wdGlvbnMuIFxuICogICAgICogSWYgdGhlIGNvb2tpZSBleGlzdHMsIHVzZSB0aGUgcnVuIGlkIHN0b3JlZCB0aGVyZS4gXG4gKiAgICAgKiBJZiB0aGUgY29va2llIGRvZXMgbm90IGV4aXN0LCBjcmVhdGUgYSBuZXcgcnVuIGZvciB0aGlzIGVuZCB1c2VyLiBcbiAqL1xuXG4vL1RPRE86IFJlbmFtZSB0aGlzIGFzICduZXcgcnVuIHBlciBzZXNzaW9uPyc7XG4vL1xuJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxuLypcbiogIGNyZWF0ZSBhIG5ldyBydW4gb25seSBpZiBub3RoaW5nIGlzIHN0b3JlZCBpbiB0aGUgY29va2llXG4qICB0aGlzIGlzIHVzZWZ1bCBmb3IgYmFzZVJ1bnMuXG4qL1xudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICAvLyBpZiB3ZSBhcmUgaGVyZSwgaXQgbWVhbnMgdGhhdCB0aGUgcnVuIGV4aXN0cy4uLiBzbyB3ZSBkb24ndCBuZWVkIGEgbmV3IG9uZVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gU3RyYXRlZ3k7XG4iLCIvKipcbiAqIFRoZSBgbmV3LWlmLXBlcnNpc3RlZGAgc3RyYXRlZ3kgY3JlYXRlcyBhIG5ldyBydW4gd2hlbiB0aGUgY3VycmVudCBvbmUgYmVjb21lcyBwZXJzaXN0ZWQgKGVuZCB1c2VyIGlzIGlkbGUgZm9yIGEgc2V0IHBlcmlvZCksIGJ1dCBvdGhlcndpc2UgdXNlcyB0aGUgY3VycmVudCBvbmUuIFxuICogXG4gKiBVc2luZyB0aGlzIHN0cmF0ZWd5IG1lYW5zIHRoYXQgd2hlbiBlbmQgdXNlcnMgbmF2aWdhdGUgYmV0d2VlbiBwYWdlcyBpbiB5b3VyIHByb2plY3QsIG9yIHJlZnJlc2ggdGhlaXIgYnJvd3NlcnMsIHRoZXkgd2lsbCBzdGlsbCBiZSB3b3JraW5nIHdpdGggdGhlIHNhbWUgcnVuLiBcbiAqIFxuICogSG93ZXZlciwgaWYgdGhleSBhcmUgaWRsZSBmb3IgbG9uZ2VyIHRoYW4geW91ciBwcm9qZWN0J3MgKipNb2RlbCBTZXNzaW9uIFRpbWVvdXQqKiAoY29uZmlndXJlZCBpbiB5b3VyIHByb2plY3QncyBbU2V0dGluZ3NdKC4uLy4uLy4uL3VwZGF0aW5nX3lvdXJfc2V0dGluZ3MvKSksIHRoZW4gdGhlaXIgcnVuIGlzIHBlcnNpc3RlZDsgdGhlIG5leHQgdGltZSB0aGV5IGludGVyYWN0IHdpdGggdGhlIHByb2plY3QsIHRoZXkgd2lsbCBnZXQgYSBuZXcgcnVuLiAoU2VlIG1vcmUgYmFja2dyb3VuZCBvbiBbUnVuIFBlcnNpc3RlbmNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvKS4pXG4gKiBcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGZvciBtdWx0aS1wYWdlIHByb2plY3RzIHdoZXJlIGVuZCB1c2VycyBwbGF5IHRocm91Z2ggYSBzaW11bGF0aW9uIGluIG9uZSBzaXR0aW5nLCBzdGVwcGluZyB0aHJvdWdoIHRoZSBtb2RlbCBzZXF1ZW50aWFsbHkgKGZvciBleGFtcGxlLCBhIFZlbnNpbSBtb2RlbCB0aGF0IHVzZXMgdGhlIGBzdGVwYCBvcGVyYXRpb24pIG9yIGNhbGxpbmcgc3BlY2lmaWMgZnVuY3Rpb25zIHVudGlsIHRoZSBtb2RlbCBpcyBcImNvbXBsZXRlLlwiIEhvd2V2ZXIsIHlvdSB3aWxsIG5lZWQgIHRvIGd1YXJhbnRlZSB0aGF0IHlvdXIgZW5kIHVzZXJzIHdpbGwgcmVtYWluIGVuZ2FnZWQgd2l0aCB0aGUgcHJvamVjdCBmcm9tIGJlZ2lubmluZyB0byBlbmQgJm1kYXNoOyBvciBhdCBsZWFzdCwgaWYgdGhleSBhcmUgaWRsZSBmb3IgbG9uZ2VyIHRoYW4gdGhlICoqTW9kZWwgU2Vzc2lvbiBUaW1lb3V0KiosIHRoYXQgaXQgaXMgb2theSBmb3IgdGhlbSB0byBzdGFydCB0aGUgcHJvamVjdCBmcm9tIHNjcmF0Y2ggKHdpdGggYW4gdW5pbml0aWFsaXplZCBtb2RlbCkuIFxuICogXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqXG4gKiAqIENoZWNrIHRoZSBgc2Vzc2lvbktleWAgY29va2llLlxuICogICAqIFRoaXMgY29va2llIGlzIHNldCBieSB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGFuZCBjb25maWd1cmFibGUgdGhyb3VnaCBpdHMgb3B0aW9ucy5cbiAqICAgKiBJZiB0aGUgY29va2llIGV4aXN0cywgY2hlY2sgd2hldGhlciB0aGUgcnVuIGlzIGluIG1lbW9yeSBvciBvbmx5IHBlcnNpc3RlZCBpbiB0aGUgZGF0YWJhc2UuIFxuICogICAgICAqIElmIHRoZSBydW4gaXMgaW4gbWVtb3J5LCB1c2UgdGhlIHJ1bi5cbiAqICAgICAgKiBJZiB0aGUgcnVuIGlzIG9ubHkgcGVyc2lzdGVkIChhbmQgbm90IHN0aWxsIGluIG1lbW9yeSksIGNyZWF0ZSBhIG5ldyBydW4gZm9yIHRoaXMgZW5kIHVzZXIuXG4gKiAgICAgICogSWYgdGhlIGNvb2tpZSBkb2VzIG5vdCBleGlzdCwgY3JlYXRlIGEgbmV3IHJ1biBmb3IgdGhpcyBlbmQgdXNlci5cbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQ29uZGl0aW9uYWxTdHJhdGVneSA9IHJlcXVpcmUoJy4vY29uZGl0aW9uYWwtY3JlYXRpb24tc3RyYXRlZ3knKTtcblxudmFyIF9fc3VwZXIgPSBDb25kaXRpb25hbFN0cmF0ZWd5LnByb3RvdHlwZTtcblxudmFyIFN0cmF0ZWd5ID0gY2xhc3NGcm9tKENvbmRpdGlvbmFsU3RyYXRlZ3ksIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgX19zdXBlci5jb25zdHJ1Y3Rvci5jYWxsKHRoaXMsIHRoaXMuY3JlYXRlSWYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBjcmVhdGVJZjogZnVuY3Rpb24gKHJ1biwgaGVhZGVycykge1xuICAgICAgICByZXR1cm4gaGVhZGVycy5nZXRSZXNwb25zZUhlYWRlcigncHJhZ21hJykgPT09ICdwZXJzaXN0ZW50JztcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIi8qKlxuICogVGhlIGBub25lYCBzdHJhdGVneSBuZXZlciByZXR1cm5zIGEgcnVuIG9yIHRyaWVzIHRvIGNyZWF0ZSBhIG5ldyBydW4uIEl0IHNpbXBseSByZXR1cm5zIHRoZSBjb250ZW50cyBvZiB0aGUgY3VycmVudCBbUnVuIFNlcnZpY2UgaW5zdGFuY2VdKC4uL3J1bi1hcGktc2VydmljZS8pLlxuICogXG4gKiBUaGlzIHN0cmF0ZWd5IGlzIHVzZWZ1bCBpZiB5b3Ugd2FudCB0byBtYW51YWxseSBkZWNpZGUgaG93IHRvIGNyZWF0ZSB5b3VyIG93biBydW5zIGFuZCBkb24ndCB3YW50IGFueSBhdXRvbWF0aWMgYXNzaXN0YW5jZS4gXG4gKiBcbiAqIEFsc28sIHRoaXMgc3RyYXRlZ3kgaXMgbmVjZXNzYXJ5IGlmIHlvdSBhcmUgd29ya2luZyB3aXRoIGEgbXVsdGlwbGF5ZXIgcHJvamVjdCBhbmQgdXNpbmcgdGhlIFtXb3JsZCBNYW5hZ2VyXSguLi93b3JsZC1tYW5hZ2VyLykgJm1kYXNoOyBvciBvdGhlciwgc2ltaWxhciBzaXR1YXRpb25zIHdoZXJlIHlvdSBkbyBub3QgaGF2ZSBkaXJlY3QgY29udHJvbCBvdmVyIGNyZWF0aW5nIHRoZSBbUnVuIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pIGluc3RhbmNlLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSB7fTtcblxuLy8gSW50ZXJmYWNlIHRoYXQgYWxsIHN0cmF0ZWdpZXMgbmVlZCB0byBpbXBsZW1lbnRcbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcblxuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZXR1cm4gYSBuZXdseSBjcmVhdGVkIHJ1blxuICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlc29sdmUoKS5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKCkge1xuICAgICAgICAvLyByZXR1cm4gYSB1c2FibGUgcnVuXG4gICAgICAgIHJldHVybiAkLkRlZmVycmVkKCkucmVzb2x2ZSh0aGlzLnJ1blNlcnZpY2UpLnByb21pc2UoKTtcbiAgICB9XG59KTtcbiIsIi8qKlxuICogVGhlIGBwZXJzaXN0ZW50LXNpbmdsZS1wbGF5ZXJgIHN0cmF0ZWd5IHJldHVybnMgdGhlIGxhdGVzdCAobW9zdCByZWNlbnQpIHJ1biBmb3IgdGhpcyB1c2VyLCB3aGV0aGVyIGl0IGlzIGluIG1lbW9yeSBvciBub3QuIElmIHRoZXJlIGFyZSBubyBydW5zIGZvciB0aGlzIHVzZXIsIGl0IGNyZWF0ZXMgYSBuZXcgb25lLlxuICpcbiAqIFRoaXMgc3RyYXRlZ3kgaXMgdXNlZnVsIGlmIHlvdXIgcHJvamVjdCBleGVjdXRlcyB5b3VyIG1vZGVsIHN0ZXAgYnkgc3RlcCAoYXMgb3Bwb3NlZCB0byBhIHByb2plY3Qgd2hlcmUgdGhlIG1vZGVsIGlzIGV4ZWN1dGVkIGNvbXBsZXRlbHksIGZvciBleGFtcGxlLCBhIFZlbnNpbSBtb2RlbCB0aGF0IGlzIGltbWVkaWF0ZWx5IHN0ZXBwZWQgdG8gdGhlIGVuZCkuIEl0IGlzIHVzZWZ1bCBpZiBlbmQgdXNlcnMgcGxheSB3aXRoIHlvdXIgcHJvamVjdCBmb3IgYW4gZXh0ZW5kZWQgcGVyaW9kIG9mIHRpbWUsIHBvc3NpYmx5IG92ZXIgc2V2ZXJhbCBzZXNzaW9ucy5cbiAqXG4gKiBTcGVjaWZpY2FsbHksIHRoZSBzdHJhdGVneSBpczpcbiAqIFxuICogKiBDaGVjayBpZiB0aGVyZSBhcmUgYW55IHJ1bnMgZm9yIHRoaXMgZW5kIHVzZXIuXG4gKiAgICAgKiBJZiB0aGVyZSBhcmUgbm8gcnVucyAoZWl0aGVyIGluIG1lbW9yeSBvciBpbiB0aGUgZGF0YWJhc2UpLCBjcmVhdGUgYSBuZXcgb25lLlxuICogICAgICogSWYgdGhlcmUgYXJlIHJ1bnMsIHRha2UgdGhlIGxhdGVzdCAobW9zdCByZWNlbnQpIG9uZS5cbiAqICAgICAgICAgKiBJZiB0aGUgbW9zdCByZWNlbnQgcnVuIGlzIGN1cnJlbnRseSBpbiB0aGUgZGF0YWJhc2UsIGJyaW5nIGl0IGJhY2sgaW50byBtZW1vcnkgc28gdGhhdCB0aGUgZW5kIHVzZXIgY2FuIGNvbnRpbnVlIHdvcmtpbmcgd2l0aCBpdC4gKFNlZSBtb3JlIGJhY2tncm91bmQgb24gW1J1biBQZXJzaXN0ZW5jZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyksIG9yIHJlYWQgbW9yZSBvbiB0aGUgdW5kZXJseWluZyBbU3RhdGUgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvb3RoZXJfYXBpcy9tb2RlbF9hcGlzL3N0YXRlLykgZm9yIGJyaW5naW5nIHJ1bnMgZnJvbSB0aGUgZGF0YWJhc2UgYmFjayBpbnRvIG1lbW9yeS4pIFxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIElkZW50aXR5U3RyYXRlZ3kgPSByZXF1aXJlKCcuL25vbmUtc3RyYXRlZ3knKTtcbnZhciBTdGF0ZUFwaSA9IHJlcXVpcmUoJy4uLy4uL3NlcnZpY2Uvc3RhdGUtYXBpLWFkYXB0ZXInKTtcblxudmFyIGRlZmF1bHRzID0ge307XG5cbnZhciBTdHJhdGVneSA9IGNsYXNzRnJvbShJZGVudGl0eVN0cmF0ZWd5LCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIFN0cmF0ZWd5KG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5zdGF0ZUFwaSA9IG5ldyBTdGF0ZUFwaSgpO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBncm91cCA9IHVzZXJTZXNzaW9uLmdyb3VwTmFtZTtcbiAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHtcbiAgICAgICAgICAgIHNjb3BlOiB7IGdyb3VwOiBncm91cCB9XG4gICAgICAgIH0sIHJ1blNlcnZpY2UuZ2V0Q3VycmVudENvbmZpZygpKTtcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2VcbiAgICAgICAgICAgIC5jcmVhdGUob3B0LCBvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgIHJ1bi5mcmVzaGx5Q3JlYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuSWRJblNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgICAgICdzY29wZS5ncm91cCc6IHVzZXJTZXNzaW9uLmdyb3VwTmFtZVxuICAgICAgICB9O1xuICAgICAgICBpZiAodXNlclNlc3Npb24udXNlcklkKSB7XG4gICAgICAgICAgICBwYXJhbXNbJ3VzZXIuaWQnXSA9IHVzZXJTZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcnVuU2VydmljZS5xdWVyeShwYXJhbXMpLnRoZW4oZnVuY3Rpb24gKHJ1bnMpIHtcbiAgICAgICAgICAgIHJldHVybiBtZS5fbG9hZEFuZENoZWNrKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBydW5zLCBvcHRpb25zKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIF9sb2FkQW5kQ2hlY2s6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVucywgb3B0aW9ucykge1xuICAgICAgICBpZiAoIXJ1bnMgfHwgIXJ1bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yZXNldChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgb3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgZGF0ZUNvbXAgPSBmdW5jdGlvbiAoYSwgYikgeyByZXR1cm4gbmV3IERhdGUoYi5kYXRlKSAtIG5ldyBEYXRlKGEuZGF0ZSk7IH07XG4gICAgICAgIHZhciBsYXRlc3RSdW4gPSBydW5zLnNvcnQoZGF0ZUNvbXApWzBdO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgc2hvdWxkUmVwbGF5ID0gZmFsc2U7XG5cbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UubG9hZChsYXRlc3RSdW4uaWQsIG51bGwsIHtcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChydW4sIG1zZywgaGVhZGVycykge1xuICAgICAgICAgICAgICAgIC8vVE9ETzogTm90IHN1cmUgdGhpcyBpcyBuZWVkZWQgYW55bW9yZSBzaW5jZSB3ZSBhdXRvLWJyaW5nIGJhY2sgaW50byBtZW1vcnlcbiAgICAgICAgICAgICAgICBzaG91bGRSZXBsYXkgPSBoZWFkZXJzLmdldFJlc3BvbnNlSGVhZGVyKCdwcmFnbWEnKSA9PT0gJ3BlcnNpc3RlbnQnO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgIGlmIChzaG91bGRSZXBsYXkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWUuc3RhdGVBcGkucmVwbGF5KHsgcnVuSWQ6IHJ1bi5pZCB9KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAocmVzcCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UubG9hZChyZXNwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG59LCB7IHJlcXVpcmVzQXV0aDogdHJ1ZSB9KTtcblxubW9kdWxlLmV4cG9ydHMgPSBTdHJhdGVneTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIEJhc2UgPSB7fTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIE9wZXJhdGlvbnMgdG8gcnVuIGluIHRoZSBtb2RlbCBmb3IgaW5pdGlhbGl6YXRpb24gdG8gYmUgY29uc2lkZXJlZCBjb21wbGV0ZS5cbiAgICAgKiBAdHlwZSB7QXJyYXl9IENhbiBiZSBpbiBhbnkgb2YgdGhlIGZvcm1hdHMgUnVuc2VydmljZSNzZXJpYWwgc3VwcG9ydHNcbiAgICAgKi9cbiAgICBpbml0T3BlcmF0aW9uOiBbXSxcblxuICAgIC8qKlxuICAgICAqIChPcHRpb25hbCkgRmxhZyB0byBzZXQgaW4gcnVuIGFmdGVyIGluaXRpYWxpemF0aW9uIG9wZXJhdGlvbiBpcyBydW4uIFlvdSdkIHR5cGljYWxseSBub3Qgb3ZlcnJpZGUgdGhpcyB1bmxlc3MgeW91IG5lZWQgdG8gc2V0IGFkZGl0aW9uYWwgcHJvcGVydGllcyBhcyB3ZWxsLlxuICAgICAqIEB0eXBlIHtPYmplY3R9XG4gICAgICovXG4gICAgZmxhZzogbnVsbCxcbn07XG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBkZWZhdWx0cywgb3B0aW9ucy5zdHJhdGVneU9wdGlvbnMpO1xuICAgICAgICBpZiAoIXRoaXMub3B0aW9ucy5pbml0T3BlcmF0aW9uIHx8ICF0aGlzLm9wdGlvbnMuaW5pdE9wZXJhdGlvbi5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignU3BlY2lmeWluZyBhbiBpbml0IGZ1bmN0aW9uIGlzIHJlcXVpcmVkIGZvciB0aGlzIHN0cmF0ZWd5Jyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF0aGlzLm9wdGlvbnMuZmxhZykge1xuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmZsYWcgPSB7XG4gICAgICAgICAgICAgICAgaXNJbml0Q29tcGxldGU6IHRydWVcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgb3B0aW9ucykge1xuICAgICAgICB2YXIgZ3JvdXAgPSB1c2VyU2Vzc2lvbiAmJiB1c2VyU2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgIHZhciBvcHQgPSAkLmV4dGVuZCh7XG4gICAgICAgICAgICBzY29wZTogeyBncm91cDogZ3JvdXAgfVxuICAgICAgICB9LCBydW5TZXJ2aWNlLmdldEN1cnJlbnRDb25maWcoKSk7XG5cbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UuY3JlYXRlKG9wdCwgb3B0aW9ucykudGhlbihmdW5jdGlvbiAoY3JlYXRlUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBydW5TZXJ2aWNlLnNlcmlhbChbXS5jb25jYXQobWUub3B0aW9ucy5pbml0T3BlcmF0aW9uKSkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVJlc3BvbnNlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKGNyZWF0ZVJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVuU2VydmljZS5zYXZlKG1lLm9wdGlvbnMuZmxhZykudGhlbihmdW5jdGlvbiAocGF0Y2hSZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgY3JlYXRlUmVzcG9uc2UsIHBhdGNoUmVzcG9uc2UpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRSdW46IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCB1c2VyU2Vzc2lvbiwgcnVuSWRJblNlc3Npb24sIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGZpbHRlciA9IHRoaXMub3B0aW9ucy5mbGFnO1xuICAgICAgICBpZiAodXNlclNlc3Npb24gJiYgdXNlclNlc3Npb24uZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICBmaWx0ZXJbJ3Njb3BlLmdyb3VwJ10gPSB1c2VyU2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHVzZXJTZXNzaW9uICYmIHVzZXJTZXNzaW9uLnVzZXJJZCkge1xuICAgICAgICAgICAgZmlsdGVyWyd1c2VyLmlkJ10gPSB1c2VyU2Vzc2lvbi51c2VySWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UuZmlsdGVyKGZpbHRlciwgeyBcbiAgICAgICAgICAgIHN0YXJ0cmVjb3JkOiAwLFxuICAgICAgICAgICAgZW5kcmVjb3JkOiAwLFxuICAgICAgICAgICAgc29ydDogJ2NyZWF0ZWQnLCBcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJ1bnMpIHtcbiAgICAgICAgICAgIGlmICghcnVucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWUucmVzZXQocnVuU2VydmljZSwgdXNlclNlc3Npb24sIG9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bnNbMF07XG4gICAgICAgIH0pO1xuICAgIH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJ1blNlcnZpY2UgPSByZXF1aXJlKCcuLi9zZXJ2aWNlL3J1bi1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbnZhciBTYXZlZFJ1bnNNYW5hZ2VyID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgIH07XG4gICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKG9wdGlvbnMucnVuKSB7XG4gICAgICAgIGlmIChvcHRpb25zLnJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgICAgIHRoaXMucnVuU2VydmljZSA9IG9wdGlvbnMucnVuO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNtID0gbmV3IFNlc3Npb25NYW5hZ2VyKG9wdGlvbnMucnVuKTtcbiAgICAgICAgICAgIHZhciBtZXJnZWRPcHRzID0gc20uZ2V0TWVyZ2VkT3B0aW9ucyh7fSwgb3B0aW9ucy5ydW4pO1xuICAgICAgICAgICAgdGhpcy5ydW5TZXJ2aWNlID0gbmV3IFJ1blNlcnZpY2UobWVyZ2VkT3B0cyk7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJ1biBvcHRpb25zIHBhc3NlZCB0byBTYXZlZFJ1bnNNYW5hZ2VyJyk7XG4gICAgfVxufTtcblxuU2F2ZWRSdW5zTWFuYWdlci5wcm90b3R5cGUgPSB7XG4gICAgbWFyazogZnVuY3Rpb24gKHJ1biwgdG9NYXJrKSB7XG4gICAgICAgIHZhciBycztcbiAgICAgICAgaWYgKHJ1biBpbnN0YW5jZW9mIFJ1blNlcnZpY2UpIHtcbiAgICAgICAgICAgIHJzID0gcnVuO1xuICAgICAgICB9IGVsc2UgaWYgKCEodHlwZW9mIFJ1biA9PT0gJ3N0cmluZycpKSB7XG4gICAgICAgICAgICB2YXIgZXhpc3RpbmdPcHRpb25zID0gdGhpcy5ydW5TZXJ2aWNlLmdldEN1cnJlbnRDb25maWcoKTtcbiAgICAgICAgICAgIHJzID0gbmV3IFJ1blNlcnZpY2UoJC5leHRlbmQodHJ1ZSwge30sIGV4aXN0aW5nT3B0aW9ucywgeyBpZDogcnVuIH0pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignSW52YWxpZCBydW4gb2JqZWN0IHByb3ZpZGVkJyk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJzLnNhdmUodG9NYXJrKTtcbiAgICB9LFxuICAgIHNhdmU6IGZ1bmN0aW9uIChydW4sIG90aGVyRmllbGRzKSB7XG4gICAgICAgIHZhciBwYXJhbSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvdGhlckZpZWxkcywgeyBzYXZlZDogdHJ1ZSwgdHJhc2hlZDogZmFsc2UgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmsocnVuLCBwYXJhbSk7XG4gICAgfSxcbiAgICByZW1vdmU6IGZ1bmN0aW9uIChydW4sIG90aGVyRmllbGRzKSB7XG4gICAgICAgIHZhciBwYXJhbSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBvdGhlckZpZWxkcywgeyBzYXZlZDogZmFsc2UsIHRyYXNoZWQ6IHRydWUgfSk7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcmsocnVuLCBwYXJhbSk7XG4gICAgfSxcbiAgICBnZXRSdW5zOiBmdW5jdGlvbiAodmFyaWFibGVzLCBmaWx0ZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgLy9UT0RPOiBBZGQgZ3JvdXAvdXNlciBzY29wZSBmaWx0ZXJzIGhlcmVcbiAgICAgICAgdmFyIGFjdGluZ0ZpbHRlciA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICBzYXZlZDogdHJ1ZSwgdHJhc2hlZDogZmFsc2VcbiAgICAgICAgfSwgZmlsdGVyKTtcblxuICAgICAgICB2YXIgb3BNb2RpZmllcnMgPSB7XG4gICAgICAgICAgICBzb3J0OiAnY3JlYXRlZCcsXG4gICAgICAgICAgICBkaXJlY3Rpb246ICdhc2MnXG4gICAgICAgIH07XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLnJ1blNlcnZpY2UucXVlcnkoYWN0aW5nRmlsdGVyLCBvcE1vZGlmaWVycykudGhlbihmdW5jdGlvbiAoc2F2ZWRSdW5zKSB7XG4gICAgICAgICAgICBpZiAoIXZhcmlhYmxlcyB8fCAhdmFyaWFibGVzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBzYXZlZFJ1bnM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgcHJvbWlzZXMgPSBzYXZlZFJ1bnMubWFwKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvbSA9IG1lLnJ1blNlcnZpY2UudmFyaWFibGVzKCkucXVlcnkoW10uY29uY2F0KHZhcmlhYmxlcyksIHt9LCB7IGZpbHRlcjogcnVuLmlkIH0pLnRoZW4oZnVuY3Rpb24gKHZhcmlhYmxlcykge1xuICAgICAgICAgICAgICAgICAgICBydW4udmFyaWFibGVzID0gdmFyaWFibGVzO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcnVuO1xuICAgICAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJ1bi52YXJpYWJsZXMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1bjtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcHJvbTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuICQud2hlbi5hcHBseShudWxsLCBwcm9taXNlcykudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEFycmF5LmFwcGx5KG51bGwsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcbm1vZHVsZS5leHBvcnRzID0gU2F2ZWRSdW5zTWFuYWdlcjtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIFJ1bk1hbmFnZXIgPSByZXF1aXJlKCcuL3J1bi1tYW5hZ2VyJyk7XG52YXIgU2F2ZWRSdW5zTWFuYWdlciA9IHJlcXVpcmUoJy4vc2F2ZWQtcnVuLW1hbmFnZXInKTtcblxudmFyIGRlZmF1bHRzID0ge1xuICAgIGJhc2VsaW5lUnVuTmFtZTogJ0Jhc2VsaW5lJyxcbn07XG5cbmZ1bmN0aW9uIFNjZW5hcmlvTWFuYWdlcihjb25maWcpIHtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB0aGlzLmJhc2VsaW5lID0gbmV3IFJ1bk1hbmFnZXIoe1xuICAgICAgICBzdHJhdGVneTogJ2Jhc2VsaW5lJyxcbiAgICAgICAgc2Vzc2lvbktleTogJ3NtLWJhc2VsaW5lLXJ1bicsXG4gICAgICAgIHJ1bjogc2VydmljZU9wdGlvbnMucnVuLFxuICAgIH0pO1xuICAgIHRoaXMuY3VycmVudCA9IG5ldyBSdW5NYW5hZ2VyKHtcbiAgICAgICAgc3RyYXRlZ3k6ICduZXctaWYtc3RlcHBlZCcsXG4gICAgICAgIHNlc3Npb25LZXk6ICdzbS1jdXJyZW50LXJ1bicsXG4gICAgICAgIHJ1bjogc2VydmljZU9wdGlvbnMucnVuLFxuICAgIH0pO1xuXG4gICAgLy9UT0RPOiBDcmVhdGluZyBvbiBpbml0IHRvIG1ha2Ugc3VyZSB0aGUgJ2dldHJ1bnMnIGNhbGwgc2VlcyB0aGlzLCBidXQgYWpheCBvbiBjb25zdHJ1Y3RvciBzb3VuZHMgdW5leHBlY3RlZC4gTWF5YmUgZG8gaXQgb24gJ2dldFJ1bnMnIGluc3RlYWQ/XG4gICAgdmFyIGJhc2VMaW5lUHJvbSA9IHRoaXMuYmFzZWxpbmUuZ2V0UnVuKCk7XG5cbiAgICB0aGlzLnNhdmVkUnVucyA9IG5ldyBTYXZlZFJ1bnNNYW5hZ2VyKHtcbiAgICAgICAgcnVuOiBzZXJ2aWNlT3B0aW9ucy5ydW4sXG4gICAgfSk7XG5cbiAgICB2YXIgb3JpZyA9IHRoaXMuc2F2ZWRSdW5zLmdldFJ1bnM7XG4gICAgdGhpcy5zYXZlZFJ1bnMuZ2V0UnVucyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5hcHBseShudWxsLCBhcmd1bWVudHMpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICByZXR1cm4gYmFzZUxpbmVQcm9tLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIG9yaWcuYXBwbHkobWUuc2F2ZWRSdW5zLCBhcmdzKTtcbiAgICAgICAgfSk7XG4gICAgfTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTY2VuYXJpb01hbmFnZXI7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG5cbnZhciBCYXNlID0ge307XG52YXIgQkFTRUxJTkVfTkFNRSA9ICdiYXNlbGluZSc7XG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChydW5TZXJ2aWNlLCBvcHRpb25zKSB7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24pIHtcbiAgICAgICAgdmFyIGdyb3VwID0gdXNlclNlc3Npb24gJiYgdXNlclNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQoe1xuICAgICAgICAgICAgc2NvcGU6IHsgZ3JvdXA6IGdyb3VwIH1cbiAgICAgICAgfSwgcnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCkpO1xuXG4gICAgICAgIHJldHVybiBydW5TZXJ2aWNlLmNyZWF0ZShvcHQpLnRoZW4oZnVuY3Rpb24gKGNyZWF0ZVJlc3BvbnNlKSB7XG4gICAgICAgICAgICByZXR1cm4gcnVuU2VydmljZS5zYXZlKHtcbiAgICAgICAgICAgICAgICBzYXZlZDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB0cmFzaGVkOiBmYWxzZSwgLy9UT0RPIHJlbW92ZSB0aGlzIG9uY2UgRVBJQ0VOVEVSLTI1MDAgaXMgZml4ZWRcbiAgICAgICAgICAgICAgICBuYW1lOiBCQVNFTElORV9OQU1FXG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChwYXRjaFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHt9LCBjcmVhdGVSZXNwb25zZSwgcGF0Y2hSZXNwb25zZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSkudGhlbihmdW5jdGlvbiAobWVyZ2VkUmVzcG9uc2UpIHtcbiAgICAgICAgICAgIHJldHVybiBydW5TZXJ2aWNlLmRvKHsgc3RlcFRvOiAnZW5kJyB9KS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVyZ2VkUmVzcG9uc2U7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFJ1bjogZnVuY3Rpb24gKHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uLCBydW5JZEluU2Vzc2lvbikge1xuICAgICAgICB2YXIgZmlsdGVyID0geyBcbiAgICAgICAgICAgIHNhdmVkOiB0cnVlLCBcbiAgICAgICAgICAgIHRyYXNoZWQ6IGZhbHNlLCAvL1RPRE8gcmVtb3ZlIHRoaXMgb25jZSBFUElDRU5URVItMjUwMCBpcyBmaXhlZFxuICAgICAgICAgICAgbmFtZTogQkFTRUxJTkVfTkFNRSxcbiAgICAgICAgICAgICdzY29wZS5ncm91cCc6IHVzZXJTZXNzaW9uLmdyb3VwTmFtZSxcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHVzZXJTZXNzaW9uLnVzZXJJZCkge1xuICAgICAgICAgICAgZmlsdGVyWyd1c2VyLmlkJ10gPSB1c2VyU2Vzc2lvbi51c2VySWQ7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UuZmlsdGVyKGZpbHRlciwgeyBcbiAgICAgICAgICAgIHN0YXJ0cmVjb3JkOiAwLFxuICAgICAgICAgICAgZW5kcmVjb3JkOiAwLFxuICAgICAgICAgICAgc29ydDogJ2NyZWF0ZWQnLCBcbiAgICAgICAgICAgIGRpcmVjdGlvbjogJ2Rlc2MnXG4gICAgICAgIH0pLnRoZW4oZnVuY3Rpb24gKHJ1bnMpIHtcbiAgICAgICAgICAgIGlmICghcnVucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWUucmVzZXQocnVuU2VydmljZSwgdXNlclNlc3Npb24pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHJ1bnNbMF07XG4gICAgICAgIH0pO1xuICAgIH1cbn0sIHsgcmVxdWlyZXNBdXRoOiB0cnVlIH0pOyIsIid1c2Ugc3RyaWN0JztcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBTdGF0ZVNlcnZpY2UgPSByZXF1aXJlKCcuLi8uLi9zZXJ2aWNlL3N0YXRlLWFwaS1hZGFwdGVyJyk7XG5cbnZhciBCYXNlID0ge307XG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24pIHtcbiAgICAgICAgdmFyIGdyb3VwID0gdXNlclNlc3Npb24gJiYgdXNlclNlc3Npb24uZ3JvdXBOYW1lO1xuICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQoe1xuICAgICAgICAgICAgc2NvcGU6IHsgZ3JvdXA6IGdyb3VwIH1cbiAgICAgICAgfSwgcnVuU2VydmljZS5nZXRDdXJyZW50Q29uZmlnKCkpO1xuICAgICAgICByZXR1cm4gcnVuU2VydmljZS5jcmVhdGUob3B0KS50aGVuKGZ1bmN0aW9uIChjcmVhdGVSZXNwb25zZSkge1xuICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2Uuc2F2ZSh7IHRyYXNoZWQ6IGZhbHNlIH0pLnRoZW4oZnVuY3Rpb24gKHBhdGNoUmVzcG9uc2UpIHsgLy9UT0RPIHJlbW92ZSB0aGlzIG9uY2UgRVBJQ0VOVEVSLTI1MDAgaXMgZml4ZWRcbiAgICAgICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIGNyZWF0ZVJlc3BvbnNlLCBwYXRjaFJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuU2VydmljZSwgdXNlclNlc3Npb24pIHtcbiAgICAgICAgdmFyIGRlZmF1bHRGaWx0ZXJQYXJhbXMgPSB7XG4gICAgICAgICAgICAnc2NvcGUuZ3JvdXAnOiB1c2VyU2Vzc2lvbi5ncm91cE5hbWVcbiAgICAgICAgfTtcbiAgICAgICAgaWYgKHVzZXJTZXNzaW9uLnVzZXJJZCkge1xuICAgICAgICAgICAgZGVmYXVsdEZpbHRlclBhcmFtc1sndXNlci5pZCddID0gdXNlclNlc3Npb24udXNlcklkO1xuICAgICAgICB9XG4gICAgICAgIHZhciBmaWx0ZXIgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdEZpbHRlclBhcmFtcywgeyBcbiAgICAgICAgICAgIHRyYXNoZWQ6IGZhbHNlLCAvL1RPRE8gY2hhbmdlIHRvICchPXRydWUnIG9uY2UgRVBJQ0VOVEVSLTI1MDAgaXMgZml4ZWRcbiAgICAgICAgfSk7IC8vQ2FuIGFsc28gZmlsdGVyIGJ5IHRpbWUwLCBidXQgYXNzdW1pbmcgaWYgaXQncyBzdGVwcGVkIGl0J2xsIGJlIHNhdmVkXG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBvdXRwdXRNb2RpZmllcnMgPSB7IFxuICAgICAgICAgICAgc3RhcnRyZWNvcmQ6IDAsXG4gICAgICAgICAgICBlbmRyZWNvcmQ6IDAsXG4gICAgICAgICAgICBzb3J0OiAnY3JlYXRlZCcsIFxuICAgICAgICAgICAgZGlyZWN0aW9uOiAnZGVzYydcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UuZmlsdGVyKGZpbHRlciwgb3V0cHV0TW9kaWZpZXJzKS50aGVuKGZ1bmN0aW9uIChydW5zKSB7XG4gICAgICAgICAgICBpZiAoIXJ1bnMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lLnJlc2V0KHJ1blNlcnZpY2UsIHVzZXJTZXNzaW9uKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBsYXN0UnVuID0gcnVuc1swXTtcbiAgICAgICAgICAgIGlmIChsYXN0UnVuLnNhdmVkICE9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGxhc3RSdW47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBiYXNlZE9uUnVuaWQgPSBsYXN0UnVuLmlkO1xuICAgICAgICAgICAgdmFyIHNhID0gbmV3IFN0YXRlU2VydmljZSgpO1xuICAgICAgICAgICAgcmV0dXJuIHNhLmNsb25lKHsgcnVuSWQ6IGJhc2VkT25SdW5pZCwgc3RvcEJlZm9yZTogJ3N0ZXBUbycgfSkudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gcnVuU2VydmljZS5sb2FkKHJlc3BvbnNlLnJ1bik7XG4gICAgICAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAvL1RPRE8gcmVtb3ZlIHRoaXMgb25jZSBFUElDRU5URVItMjUwMCBpcyBmaXhlZFxuICAgICAgICAgICAgICAgIHJldHVybiBydW5TZXJ2aWNlLnNhdmUoeyB0cmFzaGVkOiBmYWxzZSB9KS50aGVuKGZ1bmN0aW9uIChwYXRjaFJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgcnVuLCBwYXRjaFJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59LCB7IHJlcXVpcmVzQXV0aDogdHJ1ZSB9KTsiLCIndXNlIHN0cmljdCc7XG5cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMsIG1hbmFnZXIpIHtcbiAgICAgICAgcmV0dXJuIG1hbmFnZXIucmVzZXQob3B0aW9ucyk7XG4gICAgfVxufTtcbiIsIi8qKlxuKiAjIyBXb3JsZCBNYW5hZ2VyXG4qXG4qIEFzIGRpc2N1c3NlZCB1bmRlciB0aGUgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pLCBhIFtydW5dKC4uLy4uLy4uL2dsb3NzYXJ5LyNydW4pIGlzIGEgY29sbGVjdGlvbiBvZiBlbmQgdXNlciBpbnRlcmFjdGlvbnMgd2l0aCBhIHByb2plY3QgYW5kIGl0cyBtb2RlbC4gRm9yIGJ1aWxkaW5nIG11bHRpcGxheWVyIHNpbXVsYXRpb25zIHlvdSB0eXBpY2FsbHkgd2FudCBtdWx0aXBsZSBlbmQgdXNlcnMgdG8gc2hhcmUgdGhlIHNhbWUgc2V0IG9mIGludGVyYWN0aW9ucywgYW5kIHdvcmsgd2l0aGluIGEgY29tbW9uIHN0YXRlLiBFcGljZW50ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUgXCJ3b3JsZHNcIiB0byBoYW5kbGUgc3VjaCBjYXNlcy5cbipcbiogVGhlIFdvcmxkIE1hbmFnZXIgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gdHJhY2sgYW5kIGFjY2VzcyB0aGUgY3VycmVudCB3b3JsZCBhbmQgcnVuIGZvciBwYXJ0aWN1bGFyIGVuZCB1c2Vycy4gSXQgaXMgdHlwaWNhbGx5IHVzZWQgaW4gcGFnZXMgdGhhdCBlbmQgdXNlcnMgd2lsbCBpbnRlcmFjdCB3aXRoLiAoVGhlIHJlbGF0ZWQgW1dvcmxkIEFQSSBBZGFwdGVyXSguLi93b3JsZC1hcGktYWRhcHRlci8pIGhhbmRsZXMgY3JlYXRpbmcgbXVsdGlwbGF5ZXIgd29ybGRzLCBhbmQgYWRkaW5nIGFuZCByZW1vdmluZyBlbmQgdXNlcnMgYW5kIHJ1bnMgZnJvbSBhIHdvcmxkLiBCZWNhdXNlIG9mIHRoaXMsIHR5cGljYWxseSB0aGUgV29ybGQgQWRhcHRlciBpcyB1c2VkIGZvciBmYWNpbGl0YXRvciBwYWdlcyBpbiB5b3VyIHByb2plY3QuKVxuKlxuKiAjIyMgVXNpbmcgdGhlIFdvcmxkIE1hbmFnZXJcbipcbiogVG8gdXNlIHRoZSBXb3JsZCBNYW5hZ2VyLCBpbnN0YW50aWF0ZSBpdC4gVGhlbiwgbWFrZSBjYWxscyB0byBhbnkgb2YgdGhlIG1ldGhvZHMgeW91IG5lZWQuXG4qXG4qIFdoZW4geW91IGluc3RhbnRpYXRlIGEgV29ybGQgTWFuYWdlciwgdGhlIHdvcmxkJ3MgYWNjb3VudCBpZCwgcHJvamVjdCBpZCwgYW5kIGdyb3VwIGFyZSBhdXRvbWF0aWNhbGx5IHRha2VuIGZyb20gdGhlIHNlc3Npb24gKHRoYW5rcyB0byB0aGUgW0F1dGhlbnRpY2F0aW9uIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UpKS5cbipcbiogTm90ZSB0aGF0IHRoZSBXb3JsZCBNYW5hZ2VyIGRvZXMgKm5vdCogY3JlYXRlIHdvcmxkcyBhdXRvbWF0aWNhbGx5LiAoVGhpcyBpcyBkaWZmZXJlbnQgdGhhbiB0aGUgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlcikuKSBIb3dldmVyLCB5b3UgY2FuIHBhc3MgaW4gc3BlY2lmaWMgb3B0aW9ucyB0byBhbnkgcnVucyBjcmVhdGVkIGJ5IHRoZSBtYW5hZ2VyLCB1c2luZyBhIGBydW5gIG9iamVjdC5cbipcbiogVGhlIHBhcmFtZXRlcnMgZm9yIGNyZWF0aW5nIGEgV29ybGQgTWFuYWdlciBhcmU6XG4qXG4qICAgKiBgYWNjb3VudGA6IFRoZSAqKlRlYW0gSUQqKiBpbiB0aGUgRXBpY2VudGVyIHVzZXIgaW50ZXJmYWNlIGZvciB0aGlzIHByb2plY3QuXG4qICAgKiBgcHJvamVjdGA6IFRoZSAqKlByb2plY3QgSUQqKiBmb3IgdGhpcyBwcm9qZWN0LlxuKiAgICogYGdyb3VwYDogVGhlICoqR3JvdXAgTmFtZSoqIGZvciB0aGlzIHdvcmxkLlxuKiAgICogYHJ1bmA6IE9wdGlvbnMgdG8gdXNlIHdoZW4gY3JlYXRpbmcgbmV3IHJ1bnMgd2l0aCB0aGUgbWFuYWdlciwgZS5nLiBgcnVuOiB7IGZpbGVzOiBbJ2RhdGEueGxzJ10gfWAuXG4qICAgKiBgcnVuLm1vZGVsYDogVGhlIG5hbWUgb2YgdGhlIHByaW1hcnkgbW9kZWwgZmlsZSBmb3IgdGhpcyBwcm9qZWN0LiBSZXF1aXJlZCBpZiB5b3UgaGF2ZSBub3QgYWxyZWFkeSBwYXNzZWQgaXQgaW4gYXMgcGFydCBvZiB0aGUgYG9wdGlvbnNgIHBhcmFtZXRlciBmb3IgYW4gZW5jbG9zaW5nIGNhbGwuXG4qXG4qIEZvciBleGFtcGxlOlxuKlxuKiAgICAgICB2YXIgd01nciA9IG5ldyBGLm1hbmFnZXIuV29ybGRNYW5hZ2VyKHtcbiogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuKiAgICAgICAgICBydW46IHsgbW9kZWw6ICdzdXBwbHktY2hhaW4ucHknIH0sXG4qICAgICAgICAgIGdyb3VwOiAndGVhbTEnXG4qICAgICAgIH0pO1xuKlxuKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oKTtcbiovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIFdvcmxkQXBpID0gcmVxdWlyZSgnLi4vc2VydmljZS93b3JsZC1hcGktYWRhcHRlcicpO1xudmFyIFJ1bk1hbmFnZXIgPSByZXF1aXJlKCcuL3J1bi1tYW5hZ2VyJyk7XG52YXIgQXV0aE1hbmFnZXIgPSByZXF1aXJlKCcuL2F1dGgtbWFuYWdlcicpO1xudmFyIHdvcmxkQXBpO1xuXG5mdW5jdGlvbiBidWlsZFN0cmF0ZWd5KHdvcmxkSWQsIGR0ZCkge1xuXG4gICAgcmV0dXJuIGZ1bmN0aW9uIEN0b3Iob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuXG4gICAgICAgICQuZXh0ZW5kKHRoaXMsIHtcbiAgICAgICAgICAgIHJlc2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdub3QgaW1wbGVtZW50ZC4gTmVlZCBhcGkgY2hhbmdlcycpO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0UnVuOiBmdW5jdGlvbiAocnVuU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAgICAgLy9nZXQgb3IgY3JlYXRlIVxuICAgICAgICAgICAgICAgIC8vIE1vZGVsIGlzIHJlcXVpcmVkIGluIHRoZSBvcHRpb25zXG4gICAgICAgICAgICAgICAgdmFyIG1vZGVsID0gdGhpcy5vcHRpb25zLnJ1bi5tb2RlbCB8fCB0aGlzLm9wdGlvbnMubW9kZWw7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmdldEN1cnJlbnRSdW5JZCh7IG1vZGVsOiBtb2RlbCwgZmlsdGVyOiB3b3JsZElkIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW5JZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHJ1blNlcnZpY2UubG9hZChydW5JZCk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uIChydW4pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlV2l0aChtZSwgW3J1bl0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICApO1xuICAgIH07XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgeyBydW46IHt9LCB3b3JsZDoge30gfTtcblxuICAgICQuZXh0ZW5kKHRydWUsIHRoaXMub3B0aW9ucywgdGhpcy5vcHRpb25zLnJ1bik7XG4gICAgJC5leHRlbmQodHJ1ZSwgdGhpcy5vcHRpb25zLCB0aGlzLm9wdGlvbnMud29ybGQpO1xuXG4gICAgd29ybGRBcGkgPSBuZXcgV29ybGRBcGkodGhpcy5vcHRpb25zKTtcbiAgICB0aGlzLl9hdXRoID0gbmV3IEF1dGhNYW5hZ2VyKCk7XG4gICAgdmFyIG1lID0gdGhpcztcblxuICAgIHZhciBhcGkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCB3b3JsZCAob2JqZWN0KSBhbmQgYW4gaW5zdGFuY2Ugb2YgdGhlIFtXb3JsZCBBUEkgQWRhcHRlcl0oLi4vd29ybGQtYXBpLWFkYXB0ZXIvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRXb3JsZCgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkLCB3b3JsZEFkYXB0ZXIpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdvcmxkQWRhcHRlci5nZXRDdXJyZW50UnVuSWQoKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgKE9wdGlvbmFsKSBUaGUgaWQgb2YgdGhlIHVzZXIgd2hvc2Ugd29ybGQgaXMgYmVpbmcgYWNjZXNzZWQuIERlZmF1bHRzIHRvIHRoZSB1c2VyIGluIHRoZSBjdXJyZW50IHNlc3Npb24uXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBncm91cCB3aG9zZSB3b3JsZCBpcyBiZWluZyBhY2Nlc3NlZC4gRGVmYXVsdHMgdG8gdGhlIGdyb3VwIGZvciB0aGUgdXNlciBpbiB0aGUgY3VycmVudCBzZXNzaW9uLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRXb3JsZDogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuX2F1dGguZ2V0Q3VycmVudFVzZXJTZXNzaW9uSW5mbygpO1xuICAgICAgICAgICAgaWYgKCF1c2VySWQpIHtcbiAgICAgICAgICAgICAgICB1c2VySWQgPSBzZXNzaW9uLnVzZXJJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICAgICAgZ3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gd29ybGRBcGkuZ2V0Q3VycmVudFdvcmxkRm9yVXNlcih1c2VySWQsIGdyb3VwTmFtZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmV0dXJucyB0aGUgY3VycmVudCBydW4gKG9iamVjdCkgYW5kIGFuIGluc3RhbmNlIG9mIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKS5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB3TWdyLmdldEN1cnJlbnRSdW4oe21vZGVsOiAnbXlNb2RlbC5weSd9KVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihydW4sIHJ1blNlcnZpY2UpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJ1bi5pZCk7XG4gICAgICAgICogICAgICAgICAgICAgICBydW5TZXJ2aWNlLmRvKCdzdGFydEdhbWUnKTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlbCAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBtb2RlbCBmaWxlLiBSZXF1aXJlZCBpZiBub3QgYWxyZWFkeSBwYXNzZWQgaW4gYXMgYHJ1bi5tb2RlbGAgd2hlbiB0aGUgV29ybGQgTWFuYWdlciBpcyBjcmVhdGVkLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGdldEN1cnJlbnRSdW46IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIHZhciBzZXNzaW9uID0gdGhpcy5fYXV0aC5nZXRDdXJyZW50VXNlclNlc3Npb25JbmZvKCk7XG4gICAgICAgICAgICB2YXIgY3VyVXNlcklkID0gc2Vzc2lvbi51c2VySWQ7XG4gICAgICAgICAgICB2YXIgY3VyR3JvdXBOYW1lID0gc2Vzc2lvbi5ncm91cE5hbWU7XG5cbiAgICAgICAgICAgIGZ1bmN0aW9uIGdldEFuZFJlc3RvcmVMYXRlc3RSdW4od29ybGQpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucmVqZWN0KHsgZXJyb3I6ICdUaGUgdXNlciBpcyBub3QgcGFydCBvZiBhbnkgd29ybGQhJyB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgY3VycmVudFdvcmxkSWQgPSB3b3JsZC5pZDtcbiAgICAgICAgICAgICAgICB2YXIgcnVuT3B0cyA9ICQuZXh0ZW5kKHRydWUsIG1lLm9wdGlvbnMsIHsgbW9kZWw6IG1vZGVsIH0pO1xuICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGJ1aWxkU3RyYXRlZ3koY3VycmVudFdvcmxkSWQsIGR0ZCk7XG4gICAgICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LCB7XG4gICAgICAgICAgICAgICAgICAgIHN0cmF0ZWd5OiBzdHJhdGVneSxcbiAgICAgICAgICAgICAgICAgICAgcnVuOiBydW5PcHRzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIHJtID0gbmV3IFJ1bk1hbmFnZXIob3B0KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcm0uZ2V0UnVuKClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHJ1bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmUocnVuLCBybS5ydW5TZXJ2aWNlLCBybSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmdldEN1cnJlbnRXb3JsZChjdXJVc2VySWQsIGN1ckdyb3VwTmFtZSlcbiAgICAgICAgICAgICAgICAudGhlbihnZXRBbmRSZXN0b3JlTGF0ZXN0UnVuKTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgYXBpKTtcbn07XG4iLCIvKipcbiAqICMjIEZpbGUgQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgRmlsZSBBUEkgU2VydmljZSBhbGxvd3MgeW91IHRvIHVwbG9hZCBhbmQgZG93bmxvYWQgZmlsZXMgZGlyZWN0bHkgb250byBFcGljZW50ZXIsIGFuYWxvZ291cyB0byB1c2luZyB0aGUgRmlsZSBNYW5hZ2VyIFVJIGluIEVwaWNlbnRlciBkaXJlY3RseSBvciBTRlRQaW5nIGZpbGVzIGluLiBJdCBpcyBiYXNlZCBvbiB0aGUgRXBpY2VudGVyIEZpbGUgQVBJLlxuICpcbiAqIFRoZSBBc3NldCBBUEkgU2VydmljZSAoaHR0cHM6Ly9mb3Jpby5jb20vZXBpY2VudGVyL2RvY3MvcHVibGljL2FwaV9hZGFwdGVycy9nZW5lcmF0ZWQvYXNzZXQtYXBpLWFkYXB0ZXIvKSBpcyB0eXBpY2FsbHkgdXNlZCBmb3IgYWxsIHByb2plY3QgdXNlIGNhc2VzLCBhbmQgaXQncyB1bmxpa2VseSB0aGlzIEZpbGUgU2VydmljZSB3aWxsIGJlIHVzZWQgZGlyZWN0bHkgZXhjZXB0IGJ5IEFkbWluIHRvb2xzIChlLmcuIEZsb3cgSW5zcGVjdG9yKS5cbiAqXG4gKiBQYXJ0aWFsbHkgaW1wbGVtZW50ZWQuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGFjY291bnQgaWQuIEluIHRoZSBFcGljZW50ZXIgVUksIHRoaXMgaXMgdGhlICoqVGVhbSBJRCoqIChmb3IgdGVhbSBwcm9qZWN0cykgb3IgKipVc2VyIElEKiogKGZvciBwZXJzb25hbCBwcm9qZWN0cykuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHByb2plY3Q6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGZvbGRlciB0eXBlLiAgT25lIG9mIGBtb2RlbGAgfCBgc3RhdGljYCB8IGBub2RlYC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGZvbGRlclR5cGU6ICdzdGF0aWMnLFxuXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgZnVuY3Rpb24gdXBsb2FkQm9keShmaWxlTmFtZSwgY29udGVudHMpIHtcbiAgICAgICAgdmFyIGJvdW5kYXJ5ID0gJy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLTdkYTI0ZjJlNTAwNDYnO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBib2R5OiAnLS0nICsgYm91bmRhcnkgKyAnXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgICAgICdDb250ZW50LURpc3Bvc2l0aW9uOiBmb3JtLWRhdGE7IG5hbWU9XCJmaWxlXCI7JyArXG4gICAgICAgICAgICAgICAgICAgICdmaWxlbmFtZT1cIicgKyBmaWxlTmFtZSArICdcIlxcclxcbicgK1xuICAgICAgICAgICAgICAgICAgICAnQ29udGVudC10eXBlOiB0ZXh0L2h0bWxcXHJcXG5cXHJcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudHMgKyAnXFxyXFxuJyArXG4gICAgICAgICAgICAgICAgICAgICctLScgKyBib3VuZGFyeSArICctLScsXG4gICAgICAgICAgICBib3VuZGFyeTogYm91bmRhcnlcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1cGxvYWRGaWxlT3B0aW9ucyhmaWxlUGF0aCwgY29udGVudHMsIG9wdGlvbnMpIHtcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5zcGxpdCgnLycpO1xuICAgICAgICB2YXIgZmlsZU5hbWUgPSBmaWxlUGF0aC5wb3AoKTtcbiAgICAgICAgZmlsZVBhdGggPSBmaWxlUGF0aC5qb2luKCcvJyk7XG4gICAgICAgIHZhciBwYXRoID0gc2VydmljZU9wdGlvbnMuZm9sZGVyVHlwZSArICcvJyArIGZpbGVQYXRoO1xuICAgICAgICB2YXIgdXBsb2FkID0gdXBsb2FkQm9keShmaWxlTmFtZSwgY29udGVudHMpO1xuXG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoJ2ZpbGUnKSArIHBhdGgsXG4gICAgICAgICAgICBkYXRhOiB1cGxvYWQuYm9keSxcbiAgICAgICAgICAgIGNvbnRlbnRUeXBlOiAnbXVsdGlwYXJ0L2Zvcm0tZGF0YTsgYm91bmRhcnk9JyArIHVwbG9hZC5ib3VuZGFyeVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgcHVibGljQXN5bmNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgYSBkaXJlY3RvcnkgbGlzdGluZywgb3IgY29udGVudHMgb2YgYSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gZmlsZVBhdGggIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGdldENvbnRlbnRzOiBmdW5jdGlvbiAoZmlsZVBhdGgsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2VydmljZU9wdGlvbnMuZm9sZGVyVHlwZSArICcvJyArIGZpbGVQYXRoO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgICAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgnZmlsZScpICsgcGF0aFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoJycsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVwbGFjZXMgdGhlIGZpbGUgYXQgdGhlIGdpdmVuIGZpbGUgcGF0aC5cbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlUGF0aCBQYXRoIHRvIHRoZSBmaWxlXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gY29udGVudHMgQ29udGVudHMgdG8gd3JpdGUgdG8gZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IG9wdGlvbnMgIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHJlcGxhY2U6IGZ1bmN0aW9uIChmaWxlUGF0aCwgY29udGVudHMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9IHVwbG9hZEZpbGVPcHRpb25zKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnB1dChodHRwT3B0aW9ucy5kYXRhLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyZWF0ZXMgYSBmaWxlIGluIHRoZSBnaXZlbiBmaWxlIHBhdGguXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZVBhdGggUGF0aCB0byB0aGUgZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGNvbnRlbnRzIENvbnRlbnRzIHRvIHdyaXRlIHRvIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7Qm9vbGVhbn0gcmVwbGFjZUV4aXN0aW5nIFJlcGxhY2UgZmlsZSBpZiBpdCBhbHJlYWR5IGV4aXN0czsgZGVmYXVsdHMgdG8gZmFsc2VcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKGZpbGVQYXRoLCBjb250ZW50cywgcmVwbGFjZUV4aXN0aW5nLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSB1cGxvYWRGaWxlT3B0aW9ucyhmaWxlUGF0aCwgY29udGVudHMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHByb20gPSBodHRwLnBvc3QoaHR0cE9wdGlvbnMuZGF0YSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIGlmIChyZXBsYWNlRXhpc3RpbmcgPT09IHRydWUpIHtcbiAgICAgICAgICAgICAgICBwcm9tID0gcHJvbS50aGVuKG51bGwsIGZ1bmN0aW9uICh4aHIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvbmZsaWN0U3RhdHVzID0gNDA5O1xuICAgICAgICAgICAgICAgICAgICBpZiAoeGhyLnN0YXR1cyA9PT0gY29uZmxpY3RTdGF0dXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBtZS5yZXBsYWNlKGZpbGVQYXRoLCBjb250ZW50cywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcm9tO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZW1vdmVzIHRoZSBmaWxlLlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IGZpbGVQYXRoIFBhdGggdG8gdGhlIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICByZW1vdmU6IGZ1bmN0aW9uIChmaWxlUGF0aCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXJ2aWNlT3B0aW9ucy5mb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbmFtZXMgdGhlIGZpbGUuXG4gICAgICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZVBhdGggUGF0aCB0byB0aGUgZmlsZVxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IG5ld05hbWUgIE5ldyBuYW1lIG9mIGZpbGVcbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBvcHRpb25zICAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICByZW5hbWU6IGZ1bmN0aW9uIChmaWxlUGF0aCwgbmV3TmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBzZXJ2aWNlT3B0aW9ucy5mb2xkZXJUeXBlICsgJy8nICsgZmlsZVBhdGg7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdmaWxlJykgKyBwYXRoXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKHsgbmFtZTogbmV3TmFtZSB9LCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQXN5bmNBUEkpO1xufTtcbiIsIi8qKlxuICogIyMgQXNzZXQgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgQXNzZXQgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byBzdG9yZSBhc3NldHMgLS0gcmVzb3VyY2VzIG9yIGZpbGVzIG9mIGFueSBraW5kIC0tIHVzZWQgYnkgYSBwcm9qZWN0IHdpdGggYSBzY29wZSB0aGF0IGlzIHNwZWNpZmljIHRvIHByb2plY3QsIGdyb3VwLCBvciBlbmQgdXNlci5cbiAqXG4gKiBBc3NldHMgYXJlIHVzZWQgd2l0aCBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vcHJvamVjdF9hZG1pbi8jdGVhbSkuIE9uZSBjb21tb24gdXNlIGNhc2UgaXMgaGF2aW5nIGVuZCB1c2VycyBpbiBhIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3Vwcykgb3IgaW4gYSBbbXVsdGlwbGF5ZXIgd29ybGRdKC4uLy4uLy4uL2dsb3NzYXJ5LyN3b3JsZCkgdXBsb2FkIGRhdGEgLS0gdmlkZW9zIGNyZWF0ZWQgZHVyaW5nIGdhbWUgcGxheSwgcHJvZmlsZSBwaWN0dXJlcyBmb3IgY3VzdG9taXppbmcgdGhlaXIgZXhwZXJpZW5jZSwgZXRjLiAtLSBhcyBwYXJ0IG9mIHBsYXlpbmcgdGhyb3VnaCB0aGUgcHJvamVjdC5cbiAqXG4gKiBSZXNvdXJjZXMgY3JlYXRlZCB1c2luZyB0aGUgQXNzZXQgQWRhcHRlciBhcmUgc2NvcGVkOlxuICpcbiAqICAqIFByb2plY3QgYXNzZXRzIGFyZSB3cml0YWJsZSBvbmx5IGJ5IFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSwgdGhhdCBpcywgRXBpY2VudGVyIGF1dGhvcnMuXG4gKiAgKiBHcm91cCBhc3NldHMgYXJlIHdyaXRhYmxlIGJ5IGFueW9uZSB3aXRoIGFjY2VzcyB0byB0aGUgcHJvamVjdCB0aGF0IGlzIHBhcnQgb2YgdGhhdCBwYXJ0aWN1bGFyIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcykuIFRoaXMgaW5jbHVkZXMgYWxsIFt0ZWFtIG1lbWJlcnNdKC4uLy4uLy4uL2dsb3NzYXJ5LyN0ZWFtKSAoRXBpY2VudGVyIGF1dGhvcnMpIGFuZCBhbnkgW2VuZCB1c2Vyc10oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKSB3aG8gYXJlIG1lbWJlcnMgb2YgdGhlIGdyb3VwIC0tIGJvdGggZmFjaWxpdGF0b3JzIGFuZCBzdGFuZGFyZCBlbmQgdXNlcnMuXG4gKiAgKiBVc2VyIGFzc2V0cyBhcmUgd3JpdGFibGUgYnkgdGhlIHNwZWNpZmljIGVuZCB1c2VyLCBhbmQgYnkgdGhlIGZhY2lsaXRhdG9yIG9mIHRoZSBncm91cC5cbiAqICAqIEFsbCBhc3NldHMgYXJlIHJlYWRhYmxlIGJ5IGFueW9uZSB3aXRoIHRoZSBleGFjdCBVUkkuXG4gKlxuICogVG8gdXNlIHRoZSBBc3NldCBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBhY2Nlc3MgdGhlIG1ldGhvZHMgcHJvdmlkZWQuIEluc3RhbnRpYXRpbmcgcmVxdWlyZXMgdGhlIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGluIHRoZSBFcGljZW50ZXIgdXNlciBpbnRlcmZhY2UpIGFuZCBwcm9qZWN0IGlkICgqKlByb2plY3QgSUQqKikuIFRoZSBncm91cCBuYW1lIGlzIHJlcXVpcmVkIGZvciBhc3NldHMgd2l0aCBhIGdyb3VwIHNjb3BlLCBhbmQgdGhlIGdyb3VwIG5hbWUgYW5kIHVzZXJJZCBhcmUgcmVxdWlyZWQgZm9yIGFzc2V0cyB3aXRoIGEgdXNlciBzY29wZS4gSWYgbm90IGluY2x1ZGVkLCB0aGV5IGFyZSB0YWtlbiBmcm9tIHRoZSBsb2dnZWQgaW4gdXNlcidzIHNlc3Npb24gaW5mb3JtYXRpb24gaWYgbmVlZGVkLlxuICpcbiAqIFdoZW4gY3JlYXRpbmcgYW4gYXNzZXQsIHlvdSBjYW4gcGFzcyBpbiB0ZXh0IChlbmNvZGVkIGRhdGEpIHRvIHRoZSBgY3JlYXRlKClgIGNhbGwuIEFsdGVybmF0aXZlbHksIHlvdSBjYW4gbWFrZSB0aGUgYGNyZWF0ZSgpYCBjYWxsIGFzIHBhcnQgb2YgYW4gSFRNTCBmb3JtIGFuZCBwYXNzIGluIGEgZmlsZSB1cGxvYWRlZCB2aWEgdGhlIGZvcm0uXG4gKlxuICogICAgICAgLy8gaW5zdGFudGlhdGUgdGhlIEFzc2V0IEFkYXB0ZXJcbiAqICAgICAgIHZhciBhYSA9IG5ldyBGLnNlcnZpY2UuQXNzZXQoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICogICAgICAgICAgdXNlcklkOiAnMTIzNDUnXG4gKiAgICAgICB9KTtcbiAqXG4gKiAgICAgICAvLyBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgZW5jb2RlZCB0ZXh0XG4gKiAgICAgICBhYS5jcmVhdGUoJ3Rlc3QudHh0Jywge1xuICogICAgICAgICAgIGVuY29kaW5nOiAnQkFTRV82NCcsXG4gKiAgICAgICAgICAgZGF0YTogJ1ZHaHBjeUJwY3lCaElIUmxjM1FnWm1sc1pTND0nLFxuICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAqICAgICAgIH0sIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAqXG4gKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgYSBmaWxlIHVwbG9hZGVkIHRocm91Z2ggYSBmb3JtXG4gKiAgICAgICAvLyB0aGlzIHNhbXBsZSBjb2RlIGdvZXMgd2l0aCBhbiBodG1sIGZvcm0gdGhhdCBsb29rcyBsaWtlIHRoaXM6XG4gKiAgICAgICAvL1xuICogICAgICAgLy8gPGZvcm0gaWQ9XCJ1cGxvYWQtZmlsZVwiPlxuICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlXCIgdHlwZT1cImZpbGVcIj5cbiAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZW5hbWVcIiB0eXBlPVwidGV4dFwiIHZhbHVlPVwibXlGaWxlLnR4dFwiPlxuICogICAgICAgLy8gICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5VcGxvYWQgbXlGaWxlPC9idXR0b24+XG4gKiAgICAgICAvLyA8L2Zvcm0+XG4gKiAgICAgICAvL1xuICogICAgICAgJCgnI3VwbG9hZC1maWxlJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gKiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gKiAgICAgICAgICB2YXIgZmlsZW5hbWUgPSAkKCcjZmlsZW5hbWUnKS52YWwoKTtcbiAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gKiAgICAgICAgICB2YXIgaW5wdXRDb250cm9sID0gJCgnI2ZpbGUnKVswXTtcbiAqICAgICAgICAgIGRhdGEuYXBwZW5kKCdmaWxlJywgaW5wdXRDb250cm9sLmZpbGVzWzBdLCBmaWxlbmFtZSk7XG4gKlxuICogICAgICAgICAgYWEuY3JlYXRlKGZpbGVuYW1lLCBkYXRhLCB7IHNjb3BlOiAndXNlcicgfSk7XG4gKiAgICAgICB9KTtcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgX3BpY2sgPSByZXF1aXJlKCcuLi91dGlsL29iamVjdC11dGlsJykuX3BpY2s7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxudmFyIGFwaUVuZHBvaW50ID0gJ2Fzc2V0JztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRm9yIHByb2plY3RzIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIHByb2plY3QgaWQuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgZ3JvdXAgbmFtZS4gRGVmYXVsdHMgdG8gc2Vzc2lvbidzIGBncm91cE5hbWVgLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3JvdXA6IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB1c2VyIGlkLiBEZWZhdWx0cyB0byBzZXNzaW9uJ3MgYHVzZXJJZGAuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VySWQ6IHVuZGVmaW5lZCxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBzY29wZSBmb3IgdGhlIGFzc2V0LiBWYWxpZCB2YWx1ZXMgYXJlOiBgdXNlcmAsIGBncm91cGAsIGFuZCBgcHJvamVjdGAuIFNlZSBhYm92ZSBmb3IgdGhlIHJlcXVpcmVkIHBlcm1pc3Npb25zIHRvIHdyaXRlIHRvIGVhY2ggc2NvcGUuIERlZmF1bHRzIHRvIGB1c2VyYCwgbWVhbmluZyB0aGUgY3VycmVudCBlbmQgdXNlciBvciBhIGZhY2lsaXRhdG9yIGluIHRoZSBlbmQgdXNlcidzIGdyb3VwIGNhbiBlZGl0IHRoZSBhc3NldC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHNjb3BlOiAndXNlcicsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBEZXRlcm1pbmVzIGlmIGEgcmVxdWVzdCB0byBsaXN0IHRoZSBhc3NldHMgaW4gYSBzY29wZSBpbmNsdWRlcyB0aGUgY29tcGxldGUgVVJMIGZvciBlYWNoIGFzc2V0IChgdHJ1ZWApLCBvciBvbmx5IHRoZSBmaWxlIG5hbWVzIG9mIHRoZSBhc3NldHMgKGBmYWxzZWApLiBEZWZhdWx0cyB0byBgdHJ1ZWAuXG4gICAgICAgICAqIEB0eXBlIHtib29sZWFufVxuICAgICAgICAgKi9cbiAgICAgICAgZnVsbFVybDogdHJ1ZSxcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSB0cmFuc3BvcnQgb2JqZWN0IGNvbnRhaW5zIHRoZSBvcHRpb25zIHBhc3NlZCB0byB0aGUgWEhSIHJlcXVlc3QuXG4gICAgICAgICAqIEB0eXBlIHtvYmplY3R9XG4gICAgICAgICAqL1xuICAgICAgICB0cmFuc3BvcnQ6IHtcbiAgICAgICAgICAgIHByb2Nlc3NEYXRhOiBmYWxzZVxuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIGlmICghc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50ID0gdXJsQ29uZmlnLmFjY291bnRQYXRoO1xuICAgIH1cblxuICAgIGlmICghc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBhc3NldEFwaVBhcmFtcyA9IFsnZW5jb2RpbmcnLCAnZGF0YScsICdjb250ZW50VHlwZSddO1xuICAgIHZhciBzY29wZUNvbmZpZyA9IHtcbiAgICAgICAgdXNlcjogWydzY29wZScsICdhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnLCAndXNlcklkJ10sXG4gICAgICAgIGdyb3VwOiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCcsICdncm91cCddLFxuICAgICAgICBwcm9qZWN0OiBbJ3Njb3BlJywgJ2FjY291bnQnLCAncHJvamVjdCddLFxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVGaWxlbmFtZSA9IGZ1bmN0aW9uIChmaWxlbmFtZSkge1xuICAgICAgICBpZiAoIWZpbGVuYW1lKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ZpbGVuYW1lIGlzIG5lZWRlZC4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdmFsaWRhdGVVcmxQYXJhbXMgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB2YXIgcGFydEtleXMgPSBzY29wZUNvbmZpZ1tvcHRpb25zLnNjb3BlXTtcbiAgICAgICAgaWYgKCFwYXJ0S2V5cykge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdzY29wZSBwYXJhbWV0ZXIgaXMgbmVlZGVkLicpO1xuICAgICAgICB9XG5cbiAgICAgICAgJC5lYWNoKHBhcnRLZXlzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIW9wdGlvbnNbdGhpc10pIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IodGhpcyArICcgcGFyYW1ldGVyIGlzIG5lZWRlZC4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBidWlsZFVybCA9IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICB2YWxpZGF0ZVVybFBhcmFtcyhvcHRpb25zKTtcbiAgICAgICAgdmFyIHBhcnRLZXlzID0gc2NvcGVDb25maWdbb3B0aW9ucy5zY29wZV07XG4gICAgICAgIHZhciBwYXJ0cyA9ICQubWFwKHBhcnRLZXlzLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9uc1trZXldO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGZpbGVuYW1lKSB7XG4gICAgICAgICAgICAvLyBUaGlzIHByZXZlbnRzIGFkZGluZyBhIHRyYWlsaW5nIC8gaW4gdGhlIFVSTCBhcyB0aGUgQXNzZXQgQVBJXG4gICAgICAgICAgICAvLyBkb2VzIG5vdCB3b3JrIGNvcnJlY3RseSB3aXRoIGl0XG4gICAgICAgICAgICBmaWxlbmFtZSA9ICcvJyArIGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBwYXJ0cy5qb2luKCcvJykgKyBmaWxlbmFtZTtcbiAgICB9O1xuXG4gICAgLy8gUHJpdmF0ZSBmdW5jdGlvbiwgYWxsIHJlcXVlc3RzIGZvbGxvdyBhIG1vcmUgb3IgbGVzcyBzYW1lIGFwcHJvYWNoIHRvXG4gICAgLy8gdXNlIHRoZSBBc3NldCBBUEkgYW5kIHRoZSBkaWZmZXJlbmNlIGlzIHRoZSBIVFRQIHZlcmJcbiAgICAvL1xuICAgIC8vIEBwYXJhbSB7c3RyaW5nfSBtZXRob2RgIChSZXF1aXJlZCkgSFRUUCB2ZXJiXG4gICAgLy8gQHBhcmFtIHtzdHJpbmd9IGZpbGVuYW1lYCAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gZGVsZXRlL3JlcGxhY2UvY3JlYXRlXG4gICAgLy8gQHBhcmFtIHtvYmplY3R9IHBhcmFtc2AgKE9wdGlvbmFsKSBCb2R5IHBhcmFtZXRlcnMgdG8gc2VuZCB0byB0aGUgQXNzZXQgQVBJXG4gICAgLy8gQHBhcmFtIHtvYmplY3R9IG9wdGlvbnNgIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgdmFyIHVwbG9hZCA9IGZ1bmN0aW9uIChtZXRob2QsIGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFsaWRhdGVGaWxlbmFtZShmaWxlbmFtZSk7XG4gICAgICAgIC8vIG1ha2Ugc3VyZSB0aGUgcGFyYW1ldGVyIGlzIGNsZWFuXG4gICAgICAgIG1ldGhvZCA9IG1ldGhvZC50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgY29udGVudFR5cGUgPSBwYXJhbXMgaW5zdGFuY2VvZiBGb3JtRGF0YSA9PT0gdHJ1ZSA/IGZhbHNlIDogJ2FwcGxpY2F0aW9uL2pzb24nO1xuICAgICAgICBpZiAoY29udGVudFR5cGUgPT09ICdhcHBsaWNhdGlvbi9qc29uJykge1xuICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIGFzc2V0QXBpUGFyYW1zKTtcbiAgICAgICAgfSBlbHNlIHsgLy8gZWxzZSB3ZSdyZSBzZW5kaW5nIGZvcm0gZGF0YSB3aGljaCBnb2VzIGRpcmVjdGx5IGluIHJlcXVlc3QgYm9keVxuICAgICAgICAgICAgLy8gRm9yIG11bHRpcGFydC9mb3JtLWRhdGEgdXBsb2FkcyB0aGUgZmlsZW5hbWUgaXMgbm90IHNldCBpbiB0aGUgVVJMLFxuICAgICAgICAgICAgLy8gaXQncyBnZXR0aW5nIHBpY2tlZCBieSB0aGUgRm9ybURhdGEgZmllbGQgZmlsZW5hbWUuXG4gICAgICAgICAgICBmaWxlbmFtZSA9IG1ldGhvZCA9PT0gJ3Bvc3QnIHx8IG1ldGhvZCA9PT0gJ3B1dCcgPyAnJyA6IGZpbGVuYW1lO1xuICAgICAgICB9XG4gICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdmFyIHVybCA9IGJ1aWxkVXJsKGZpbGVuYW1lLCB1cmxPcHRpb25zKTtcbiAgICAgICAgdmFyIGNyZWF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdXJsT3B0aW9ucywgeyB1cmw6IHVybCwgY29udGVudFR5cGU6IGNvbnRlbnRUeXBlIH0pO1xuXG4gICAgICAgIHJldHVybiBodHRwW21ldGhvZF0ocGFyYW1zLCBjcmVhdGVPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICogQ3JlYXRlcyBhIGZpbGUgaW4gdGhlIEFzc2V0IEFQSS4gVGhlIHNlcnZlciByZXR1cm5zIGFuIGVycm9yIChzdGF0dXMgY29kZSBgNDA5YCwgY29uZmxpY3QpIGlmIHRoZSBmaWxlIGFscmVhZHkgZXhpc3RzLCBzb1xuICAgICAgICAqIGNoZWNrIGZpcnN0IHdpdGggYSBgbGlzdCgpYCBvciBhIGBnZXQoKWAuXG4gICAgICAgICpcbiAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBhYSA9IG5ldyBGLnNlcnZpY2UuQXNzZXQoe1xuICAgICAgICAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgIGdyb3VwOiAndGVhbTEnLFxuICAgICAgICAqICAgICAgICAgIHVzZXJJZDogJydcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIC8vIGNyZWF0ZSBhIG5ldyBhc3NldCB1c2luZyBlbmNvZGVkIHRleHRcbiAgICAgICAgKiAgICAgICBhYS5jcmVhdGUoJ3Rlc3QudHh0Jywge1xuICAgICAgICAqICAgICAgICAgICBlbmNvZGluZzogJ0JBU0VfNjQnLFxuICAgICAgICAqICAgICAgICAgICBkYXRhOiAnVkdocGN5QnBjeUJoSUhSbGMzUWdabWxzWlM0PScsXG4gICAgICAgICogICAgICAgICAgIGNvbnRlbnRUeXBlOiAndGV4dC9wbGFpbidcbiAgICAgICAgKiAgICAgICB9LCB7IHNjb3BlOiAndXNlcicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAvLyBhbHRlcm5hdGl2ZWx5LCBjcmVhdGUgYSBuZXcgYXNzZXQgdXNpbmcgYSBmaWxlIHVwbG9hZGVkIHRocm91Z2ggYSBmb3JtXG4gICAgICAgICogICAgICAgLy8gdGhpcyBzYW1wbGUgY29kZSBnb2VzIHdpdGggYW4gaHRtbCBmb3JtIHRoYXQgbG9va3MgbGlrZSB0aGlzOlxuICAgICAgICAqICAgICAgIC8vXG4gICAgICAgICogICAgICAgLy8gPGZvcm0gaWQ9XCJ1cGxvYWQtZmlsZVwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZVwiIHR5cGU9XCJmaWxlXCI+XG4gICAgICAgICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJmaWxlbmFtZVwiIHR5cGU9XCJ0ZXh0XCIgdmFsdWU9XCJteUZpbGUudHh0XCI+XG4gICAgICAgICogICAgICAgLy8gICA8YnV0dG9uIHR5cGU9XCJzdWJtaXRcIj5VcGxvYWQgbXlGaWxlPC9idXR0b24+XG4gICAgICAgICogICAgICAgLy8gPC9mb3JtPlxuICAgICAgICAqICAgICAgIC8vXG4gICAgICAgICogICAgICAgJCgnI3VwbG9hZC1maWxlJykub24oJ3N1Ym1pdCcsIGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICogICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBmaWxlbmFtZSA9ICQoJyNmaWxlbmFtZScpLnZhbCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGlucHV0Q29udHJvbCA9ICQoJyNmaWxlJylbMF07XG4gICAgICAgICogICAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBpbnB1dENvbnRyb2wuZmlsZXNbMF0sIGZpbGVuYW1lKTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgIGFhLmNyZWF0ZShmaWxlbmFtZSwgZGF0YSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGNyZWF0ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIChPcHRpb25hbCkgQm9keSBwYXJhbWV0ZXJzIHRvIHNlbmQgdG8gdGhlIEFzc2V0IEFQSS4gUmVxdWlyZWQgaWYgdGhlIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLCBvdGhlcndpc2UgaWdub3JlZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmVuY29kaW5nIEVpdGhlciBgSEVYYCBvciBgQkFTRV82NGAuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuZGF0YSBUaGUgZW5jb2RlZCBkYXRhIGZvciB0aGUgZmlsZS4gUmVxdWlyZWQgaWYgYG9wdGlvbnMudHJhbnNwb3J0LmNvbnRlbnRUeXBlYCBpcyBgYXBwbGljYXRpb24vanNvbmAuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5jb250ZW50VHlwZSBUaGUgbWltZSB0eXBlIG9mIHRoZSBmaWxlLiBPcHRpb25hbC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiB1cGxvYWQoJ3Bvc3QnLCBmaWxlbmFtZSwgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIGEgZmlsZSBmcm9tIHRoZSBBc3NldCBBUEksIGZldGNoaW5nIHRoZSBhc3NldCBjb250ZW50LiAoVG8gZ2V0IGEgbGlzdFxuICAgICAgICAqIG9mIHRoZSBhc3NldHMgaW4gYSBzY29wZSwgdXNlIGBsaXN0KClgLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgdG8gcmV0cmlldmUuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChmaWxlbmFtZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGdldFNlcnZpY2VPcHRpb25zID0gX3BpY2soc2VydmljZU9wdGlvbnMsIFsnc2NvcGUnLCAnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJywgJ3VzZXJJZCddKTtcbiAgICAgICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIGdldFNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSBidWlsZFVybChmaWxlbmFtZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCB1cmxPcHRpb25zLCB7IHVybDogdXJsIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIGxpc3Qgb2YgdGhlIGFzc2V0cyBpbiBhIHNjb3BlLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIGFhLmxpc3QoeyBmdWxsVXJsOiB0cnVlIH0pLnRoZW4oZnVuY3Rpb24oZmlsZUxpc3Qpe1xuICAgICAgICAqICAgICAgICAgICBjb25zb2xlLmxvZygnYXJyYXkgb2YgZmlsZXMgPSAnLCBmaWxlTGlzdCk7XG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBvcHRpb25zLnNjb3BlIChPcHRpb25hbCkgVGhlIHNjb3BlIChgdXNlcmAsIGBncm91cGAsIGBwcm9qZWN0YCkuXG4gICAgICAgICogQHBhcmFtIHtib29sZWFufSBvcHRpb25zLmZ1bGxVcmwgKE9wdGlvbmFsKSBEZXRlcm1pbmVzIGlmIHRoZSBsaXN0IG9mIGFzc2V0cyBpbiBhIHNjb3BlIGluY2x1ZGVzIHRoZSBjb21wbGV0ZSBVUkwgZm9yIGVhY2ggYXNzZXQgKGB0cnVlYCksIG9yIG9ubHkgdGhlIGZpbGUgbmFtZXMgb2YgdGhlIGFzc2V0cyAoYGZhbHNlYCkuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbGlzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICAgICAgdmFyIHVybE9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgdmFyIHVybCA9IGJ1aWxkVXJsKCcnLCB1cmxPcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHVybE9wdGlvbnMsIHsgdXJsOiB1cmwgfSk7XG4gICAgICAgICAgICB2YXIgZnVsbFVybCA9IGdldE9wdGlvbnMuZnVsbFVybDtcblxuICAgICAgICAgICAgaWYgKCFmdWxsVXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KHt9LCBnZXRPcHRpb25zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaHR0cC5nZXQoe30sIGdldE9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKGZpbGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmdWxsUGF0aEZpbGVzID0gJC5tYXAoZmlsZXMsIGZ1bmN0aW9uIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYnVpbGRVcmwoZmlsZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZVdpdGgobWUsIFtmdWxsUGF0aEZpbGVzXSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogUmVwbGFjZXMgYW4gZXhpc3RpbmcgZmlsZSBpbiB0aGUgQXNzZXQgQVBJLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIC8vIHJlcGxhY2UgYW4gYXNzZXQgdXNpbmcgZW5jb2RlZCB0ZXh0XG4gICAgICAgICogICAgICAgYWEucmVwbGFjZSgndGVzdC50eHQnLCB7XG4gICAgICAgICogICAgICAgICAgIGVuY29kaW5nOiAnQkFTRV82NCcsXG4gICAgICAgICogICAgICAgICAgIGRhdGE6ICdWR2hwY3lCcGN5QmhJSE5sWTI5dVpDQjBaWE4wSUdacGJHVXUnLFxuICAgICAgICAqICAgICAgICAgICBjb250ZW50VHlwZTogJ3RleHQvcGxhaW4nXG4gICAgICAgICogICAgICAgfSwgeyBzY29wZTogJ3VzZXInIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgLy8gYWx0ZXJuYXRpdmVseSwgcmVwbGFjZSBhbiBhc3NldCB1c2luZyBhIGZpbGUgdXBsb2FkZWQgdGhyb3VnaCBhIGZvcm1cbiAgICAgICAgKiAgICAgICAvLyB0aGlzIHNhbXBsZSBjb2RlIGdvZXMgd2l0aCBhbiBodG1sIGZvcm0gdGhhdCBsb29rcyBsaWtlIHRoaXM6XG4gICAgICAgICogICAgICAgLy9cbiAgICAgICAgKiAgICAgICAvLyA8Zm9ybSBpZD1cInJlcGxhY2UtZmlsZVwiPlxuICAgICAgICAqICAgICAgIC8vICAgPGlucHV0IGlkPVwiZmlsZVwiIHR5cGU9XCJmaWxlXCI+XG4gICAgICAgICogICAgICAgLy8gICA8aW5wdXQgaWQ9XCJyZXBsYWNlLWZpbGVuYW1lXCIgdHlwZT1cInRleHRcIiB2YWx1ZT1cIm15RmlsZS50eHRcIj5cbiAgICAgICAgKiAgICAgICAvLyAgIDxidXR0b24gdHlwZT1cInN1Ym1pdFwiPlJlcGxhY2UgbXlGaWxlPC9idXR0b24+XG4gICAgICAgICogICAgICAgLy8gPC9mb3JtPlxuICAgICAgICAqICAgICAgIC8vXG4gICAgICAgICogICAgICAgJCgnI3JlcGxhY2UtZmlsZScpLm9uKCdzdWJtaXQnLCBmdW5jdGlvbiAoZSkge1xuICAgICAgICAqICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgKiAgICAgICAgICB2YXIgZmlsZW5hbWUgPSAkKCcjcmVwbGFjZS1maWxlbmFtZScpLnZhbCgpO1xuICAgICAgICAqICAgICAgICAgIHZhciBkYXRhID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgICAgICogICAgICAgICAgdmFyIGlucHV0Q29udHJvbCA9ICQoJyNmaWxlJylbMF07XG4gICAgICAgICogICAgICAgICAgZGF0YS5hcHBlbmQoJ2ZpbGUnLCBpbnB1dENvbnRyb2wuZmlsZXNbMF0sIGZpbGVuYW1lKTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgICAgIGFhLnJlcGxhY2UoZmlsZW5hbWUsIGRhdGEsIHsgc2NvcGU6ICd1c2VyJyB9KTtcbiAgICAgICAgKiAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBmaWxlbmFtZSAoUmVxdWlyZWQpIE5hbWUgb2YgdGhlIGZpbGUgYmVpbmcgcmVwbGFjZWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyAoT3B0aW9uYWwpIEJvZHkgcGFyYW1ldGVycyB0byBzZW5kIHRvIHRoZSBBc3NldCBBUEkuIFJlcXVpcmVkIGlmIHRoZSBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYCwgb3RoZXJ3aXNlIGlnbm9yZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5lbmNvZGluZyBFaXRoZXIgYEhFWGAgb3IgYEJBU0VfNjRgLiBSZXF1aXJlZCBpZiBgb3B0aW9ucy50cmFuc3BvcnQuY29udGVudFR5cGVgIGlzIGBhcHBsaWNhdGlvbi9qc29uYC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmRhdGEgVGhlIGVuY29kZWQgZGF0YSBmb3IgdGhlIGZpbGUuIFJlcXVpcmVkIGlmIGBvcHRpb25zLnRyYW5zcG9ydC5jb250ZW50VHlwZWAgaXMgYGFwcGxpY2F0aW9uL2pzb25gLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuY29udGVudFR5cGUgVGhlIG1pbWUgdHlwZSBvZiB0aGUgZmlsZS4gT3B0aW9uYWwuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICByZXBsYWNlOiBmdW5jdGlvbiAoZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgcmV0dXJuIHVwbG9hZCgncHV0JywgZmlsZW5hbWUsIHBhcmFtcywgb3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyBhIGZpbGUgZnJvbSB0aGUgQXNzZXQgQVBJLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIGFhLmRlbGV0ZShzYW1wbGVGaWxlTmFtZSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gZmlsZW5hbWUgKFJlcXVpcmVkKSBOYW1lIG9mIHRoZSBmaWxlIHRvIGRlbGV0ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24gKGZpbGVuYW1lLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gdXBsb2FkKCdkZWxldGUnLCBmaWxlbmFtZSwge30sIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFzc2V0VXJsOiBmdW5jdGlvbiAoZmlsZW5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciB1cmxPcHRpb25zID0gJC5leHRlbmQoe30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBidWlsZFVybChmaWxlbmFtZSwgdXJsT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyMgQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2UgcHJvdmlkZXMgYSBtZXRob2QgZm9yIGxvZ2dpbmcgaW4sIHdoaWNoIGNyZWF0ZXMgYW5kIHJldHVybnMgYSB1c2VyIGFjY2VzcyB0b2tlbi5cbiAqXG4gKiBVc2VyIGFjY2VzcyB0b2tlbnMgYXJlIHJlcXVpcmVkIGZvciBlYWNoIGNhbGwgdG8gRXBpY2VudGVyLiAoU2VlIFtQcm9qZWN0IEFjY2Vzc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi4pXG4gKlxuICogSWYgeW91IG5lZWQgYWRkaXRpb25hbCBmdW5jdGlvbmFsaXR5IC0tIHN1Y2ggYXMgdHJhY2tpbmcgc2Vzc2lvbiBpbmZvcm1hdGlvbiwgZWFzaWx5IHJldHJpZXZpbmcgdGhlIHVzZXIgdG9rZW4sIG9yIGdldHRpbmcgdGhlIGdyb3VwcyB0byB3aGljaCBhbiBlbmQgdXNlciBiZWxvbmdzIC0tIGNvbnNpZGVyIHVzaW5nIHRoZSBbQXV0aG9yaXphdGlvbiBNYW5hZ2VyXSguLi9hdXRoLW1hbmFnZXIvKSBpbnN0ZWFkLlxuICpcbiAqICAgICAgdmFyIGF1dGggPSBuZXcgRi5zZXJ2aWNlLkF1dGgoKTtcbiAqICAgICAgYXV0aC5sb2dpbih7IHVzZXJOYW1lOiAnanNtaXRoQGFjbWVzaW11bGF0aW9ucy5jb20nLFxuICogICAgICAgICAgICAgICAgICBwYXNzd29yZDogJ3Bhc3N3MHJkJyB9KTtcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogRW1haWwgb3IgdXNlcm5hbWUgdG8gdXNlIGZvciBsb2dnaW5nIGluLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VyTmFtZTogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFBhc3N3b3JkIGZvciBzcGVjaWZpZWQgYHVzZXJOYW1lYC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFzc3dvcmQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZCBmb3IgdGhpcyBgdXNlck5hbWVgLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yIHRoZSAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gUmVxdWlyZWQgaWYgdGhlIGB1c2VyTmFtZWAgaXMgZm9yIGFuIFtlbmQgdXNlcl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3VzZXJzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKCdhdXRoZW50aWNhdGlvbicpXG4gICAgfSk7XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvZ3MgdXNlciBpbiwgcmV0dXJuaW5nIHRoZSB1c2VyIGFjY2VzcyB0b2tlbi5cbiAgICAgICAgICpcbiAgICAgICAgICogSWYgbm8gYHVzZXJOYW1lYCBvciBgcGFzc3dvcmRgIHdlcmUgcHJvdmlkZWQgaW4gdGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvcHRpb25zLCB0aGV5IGFyZSByZXF1aXJlZCBpbiB0aGUgYG9wdGlvbnNgIGhlcmUuIElmIG5vIGBhY2NvdW50YCB3YXMgcHJvdmlkZWQgaW4gdGhlIGluaXRpYWwgY29uZmlndXJhdGlvbiBvcHRpb25zIGFuZCB0aGUgYHVzZXJOYW1lYCBpcyBmb3IgYW4gW2VuZCB1c2VyXSguLi8uLi8uLi9nbG9zc2FyeS8jdXNlcnMpLCB0aGUgYGFjY291bnRgIGlzIHJlcXVpcmVkIGFzIHdlbGwuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgYXV0aC5sb2dpbih7XG4gICAgICAgICAqICAgICAgICAgIHVzZXJOYW1lOiAnanNtaXRoJyxcbiAgICAgICAgICogICAgICAgICAgcGFzc3dvcmQ6ICdwYXNzdzByZCcsXG4gICAgICAgICAqICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyB9KVxuICAgICAgICAgKiAgICAgIC50aGVuKGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICAgKiAgICAgICAgICBjb25zb2xlLmxvZyhcInVzZXIgYWNjZXNzIHRva2VuIGlzOiBcIiwgdG9rZW4uYWNjZXNzX3Rva2VuKTtcbiAgICAgICAgICogICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGxvZ2luOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgeyBzdWNjZXNzOiAkLm5vb3AgfSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaWYgKCFodHRwT3B0aW9ucy51c2VyTmFtZSB8fCAhaHR0cE9wdGlvbnMucGFzc3dvcmQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzcCA9IHsgc3RhdHVzOiA0MDEsIHN0YXR1c01lc3NhZ2U6ICdObyB1c2VybmFtZSBvciBwYXNzd29yZCBzcGVjaWZpZWQuJyB9O1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLmVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuZXJyb3IuY2FsbCh0aGlzLCByZXNwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJC5EZWZlcnJlZCgpLnJlamVjdChyZXNwKS5wcm9taXNlKCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBwb3N0UGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIHVzZXJOYW1lOiBodHRwT3B0aW9ucy51c2VyTmFtZSxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogaHR0cE9wdGlvbnMucGFzc3dvcmQsXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKGh0dHBPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgICAgICAgICAvL3Bhc3MgaW4gbnVsbCBmb3IgYWNjb3VudCB1bmRlciBvcHRpb25zIGlmIHlvdSBkb24ndCB3YW50IGl0IHRvIGJlIHNlbnRcbiAgICAgICAgICAgICAgICBwb3N0UGFyYW1zLmFjY291bnQgPSBodHRwT3B0aW9ucy5hY2NvdW50O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBvc3RQYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvLyAocmVwbGFjZSB3aXRoIC8qICovIGNvbW1lbnQgYmxvY2ssIHRvIG1ha2UgdmlzaWJsZSBpbiBkb2NzLCBvbmNlIHRoaXMgaXMgbW9yZSB0aGFuIGEgbm9vcClcbiAgICAgICAgLy9cbiAgICAgICAgLy8gTG9ncyB1c2VyIG91dCBmcm9tIHNwZWNpZmllZCBhY2NvdW50cy5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gRXBpY2VudGVyIGxvZ291dCBpcyBub3QgaW1wbGVtZW50ZWQgeWV0LCBzbyBmb3Igbm93IHRoaXMgaXMgYSBkdW1teSBwcm9taXNlIHRoYXQgZ2V0cyBhdXRvbWF0aWNhbGx5IHJlc29sdmVkLlxuICAgICAgICAvL1xuICAgICAgICAvLyAqKkV4YW1wbGUqKlxuICAgICAgICAvL1xuICAgICAgICAvLyAgICAgIGF1dGgubG9nb3V0KCk7XG4gICAgICAgIC8vXG4gICAgICAgIC8vICoqUGFyYW1ldGVycyoqXG4gICAgICAgIC8vIEBwYXJhbSB7T2JqZWN0fSBgb3B0aW9uc2AgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgLy9cbiAgICAgICAgbG9nb3V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgICAgIGR0ZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICogIyMgQ2hhbm5lbCBTZXJ2aWNlXG4gKlxuICogVGhlIEVwaWNlbnRlciBwbGF0Zm9ybSBwcm92aWRlcyBhIHB1c2ggY2hhbm5lbCwgd2hpY2ggYWxsb3dzIHlvdSB0byBwdWJsaXNoIGFuZCBzdWJzY3JpYmUgdG8gbWVzc2FnZXMgd2l0aGluIGEgW3Byb2plY3RdKC4uLy4uLy4uL2dsb3NzYXJ5LyNwcm9qZWN0cyksIFtncm91cF0oLi4vLi4vLi4vZ2xvc3NhcnkvI2dyb3VwcyksIG9yIFttdWx0aXBsYXllciB3b3JsZF0oLi4vLi4vLi4vZ2xvc3NhcnkvI3dvcmxkKS4gVGhlcmUgYXJlIHR3byBtYWluIHVzZSBjYXNlcyBmb3IgdGhlIGNoYW5uZWw6IGV2ZW50IG5vdGlmaWNhdGlvbnMgYW5kIGNoYXQgbWVzc2FnZXMuXG4gKlxuICogVGhlIENoYW5uZWwgU2VydmljZSBpcyBhIGJ1aWxkaW5nIGJsb2NrIGZvciB0aGlzIGZ1bmN0aW9uYWxpdHkuIEl0IGNyZWF0ZXMgYSBwdWJsaXNoLXN1YnNjcmliZSBvYmplY3QsIGFsbG93aW5nIHlvdSB0byBwdWJsaXNoIG1lc3NhZ2VzLCBzdWJzY3JpYmUgdG8gbWVzc2FnZXMsIG9yIHVuc3Vic2NyaWJlIGZyb20gbWVzc2FnZXMgZm9yIGEgZ2l2ZW4gJ3RvcGljJyBvbiBhIGAkLmNvbWV0ZGAgdHJhbnNwb3J0IGluc3RhbmNlLlxuICpcbiAqIFR5cGljYWxseSwgeW91IHVzZSB0aGUgW0VwaWNlbnRlciBDaGFubmVsIE1hbmFnZXJdKC4uL2VwaWNlbnRlci1jaGFubmVsLW1hbmFnZXIvKSB0byBjcmVhdGUgb3IgcmV0cmlldmUgY2hhbm5lbHMsIHRoZW4gdXNlIHRoZSBDaGFubmVsIFNlcnZpY2UgYHN1YnNjcmliZSgpYCBhbmQgYHB1Ymxpc2goKWAgbWV0aG9kcyB0byBsaXN0ZW4gdG8gb3IgdXBkYXRlIGRhdGEuIChGb3IgYWRkaXRpb25hbCBiYWNrZ3JvdW5kIG9uIEVwaWNlbnRlcidzIHB1c2ggY2hhbm5lbCwgc2VlIHRoZSBpbnRyb2R1Y3Rvcnkgbm90ZXMgb24gdGhlIFtQdXNoIENoYW5uZWwgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvY2hhbm5lbC8pIHBhZ2UuKVxuICpcbiAqIFlvdSdsbCBuZWVkIHRvIGluY2x1ZGUgdGhlIGBlcGljZW50ZXItbXVsdGlwbGF5ZXItZGVwZW5kZW5jaWVzLmpzYCBsaWJyYXJ5IGluIGFkZGl0aW9uIHRvIHRoZSBgZXBpY2VudGVyLmpzYCBsaWJyYXJ5IGluIHlvdXIgcHJvamVjdCB0byB1c2UgdGhlIENoYW5uZWwgU2VydmljZS4gU2VlIFtJbmNsdWRpbmcgRXBpY2VudGVyLmpzXSguLi8uLi8jaW5jbHVkZSkuXG4gKlxuICogVG8gdXNlIHRoZSBDaGFubmVsIFNlcnZpY2UsIGluc3RhbnRpYXRlIGl0LCB0aGVuIG1ha2UgY2FsbHMgdG8gYW55IG9mIHRoZSBtZXRob2RzIHlvdSBuZWVkLlxuICpcbiAqICAgICAgICB2YXIgY3MgPSBuZXcgRi5zZXJ2aWNlLkNoYW5uZWwoKTtcbiAqICAgICAgICBjcy5wdWJsaXNoKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuL3ZhcmlhYmxlcycsIHsgcHJpY2U6IDUwIH0pO1xuICpcbiAqIFRoZSBwYXJhbWV0ZXJzIGZvciBpbnN0YW50aWF0aW5nIGEgQ2hhbm5lbCBTZXJ2aWNlIGluY2x1ZGU6XG4gKlxuICogKiBgb3B0aW9uc2AgVGhlIG9wdGlvbnMgb2JqZWN0IHRvIGNvbmZpZ3VyZSB0aGUgQ2hhbm5lbCBTZXJ2aWNlLlxuICogKiBgb3B0aW9ucy5iYXNlYCBUaGUgYmFzZSB0b3BpYy4gVGhpcyBpcyBhZGRlZCBhcyBhIHByZWZpeCB0byBhbGwgZnVydGhlciB0b3BpY3MgeW91IHB1Ymxpc2ggb3Igc3Vic2NyaWJlIHRvIHdoaWxlIHdvcmtpbmcgd2l0aCB0aGlzIENoYW5uZWwgU2VydmljZS5cbiAqICogYG9wdGlvbnMudG9waWNSZXNvbHZlcmAgQSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyBhbGwgJ3RvcGljcycgcGFzc2VkIGludG8gdGhlIGBwdWJsaXNoYCBhbmQgYHN1YnNjcmliZWAgbWV0aG9kcy4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gaW1wbGVtZW50IHlvdXIgb3duIHNlcmlhbGl6ZSBmdW5jdGlvbnMgZm9yIGNvbnZlcnRpbmcgY3VzdG9tIG9iamVjdHMgdG8gdG9waWMgbmFtZXMuIFJldHVybnMgYSBTdHJpbmcuIEJ5IGRlZmF1bHQsIGl0IGp1c3QgZWNob2VzIHRoZSB0b3BpYy5cbiAqICogYG9wdGlvbnMudHJhbnNwb3J0YCBUaGUgaW5zdGFuY2Ugb2YgYCQuY29tZXRkYCB0byBob29rIG9udG8uIFNlZSBodHRwOi8vZG9jcy5jb21ldGQub3JnL3JlZmVyZW5jZS9qYXZhc2NyaXB0Lmh0bWwgZm9yIGFkZGl0aW9uYWwgYmFja2dyb3VuZCBvbiBjb21ldGQuXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xudmFyIENoYW5uZWwgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGJhc2UgdG9waWMuIFRoaXMgaXMgYWRkZWQgYXMgYSBwcmVmaXggdG8gYWxsIGZ1cnRoZXIgdG9waWNzIHlvdSBwdWJsaXNoIG9yIHN1YnNjcmliZSB0byB3aGlsZSB3b3JraW5nIHdpdGggdGhpcyBDaGFubmVsIFNlcnZpY2UuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBiYXNlOiAnJyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQSBmdW5jdGlvbiB0aGF0IHByb2Nlc3NlcyBhbGwgJ3RvcGljcycgcGFzc2VkIGludG8gdGhlIGBwdWJsaXNoYCBhbmQgYHN1YnNjcmliZWAgbWV0aG9kcy4gVGhpcyBpcyB1c2VmdWwgaWYgeW91IHdhbnQgdG8gaW1wbGVtZW50IHlvdXIgb3duIHNlcmlhbGl6ZSBmdW5jdGlvbnMgZm9yIGNvbnZlcnRpbmcgY3VzdG9tIG9iamVjdHMgdG8gdG9waWMgbmFtZXMuIEJ5IGRlZmF1bHQsIGl0IGp1c3QgZWNob2VzIHRoZSB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogKiBgdG9waWNgIFRvcGljIHRvIHBhcnNlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlJldHVybiBWYWx1ZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICogKlN0cmluZyo6IFRoaXMgZnVuY3Rpb24gc2hvdWxkIHJldHVybiBhIHN0cmluZyB0b3BpYy5cbiAgICAgICAgICpcbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gdG9waWMgdG9waWMgdG8gcmVzb2x2ZVxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b3BpY1Jlc29sdmVyOiBmdW5jdGlvbiAodG9waWMpIHtcbiAgICAgICAgICAgIHJldHVybiB0b3BpYztcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGluc3RhbmNlIG9mIGAkLmNvbWV0ZGAgdG8gaG9vayBvbnRvLlxuICAgICAgICAgKiBAdHlwZSB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiBudWxsXG4gICAgfTtcbiAgICB0aGlzLmNoYW5uZWxPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIGRlZmF1bHRzLCBvcHRpb25zKTtcbn07XG5cbnZhciBtYWtlTmFtZSA9IGZ1bmN0aW9uIChjaGFubmVsTmFtZSwgdG9waWMpIHtcbiAgICAvL1JlcGxhY2UgdHJhaWxpbmcvZG91YmxlIHNsYXNoZXNcbiAgICB2YXIgbmV3TmFtZSA9IChjaGFubmVsTmFtZSA/IChjaGFubmVsTmFtZSArICcvJyArIHRvcGljKSA6IHRvcGljKS5yZXBsYWNlKC9cXC9cXC8vZywgJy8nKS5yZXBsYWNlKC9cXC8kLywgJycpO1xuICAgIHJldHVybiBuZXdOYW1lO1xufTtcblxuXG5DaGFubmVsLnByb3RvdHlwZSA9ICQuZXh0ZW5kKENoYW5uZWwucHJvdG90eXBlLCB7XG5cbiAgICAvLyBmdXR1cmUgZnVuY3Rpb25hbGl0eTpcbiAgICAvLyAgICAgIC8vIFNldCB0aGUgY29udGV4dCBmb3IgdGhlIGNhbGxiYWNrXG4gICAgLy8gICAgICBjcy5zdWJzY3JpYmUoJ3J1bicsIGZ1bmN0aW9uICgpIHsgdGhpcy5pbm5lckhUTUwgPSAnVHJpZ2dlcmVkJ30sIGRvY3VtZW50LmJvZHkpO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIENvbnRyb2wgdGhlIG9yZGVyIG9mIG9wZXJhdGlvbnMgYnkgc2V0dGluZyB0aGUgYHByaW9yaXR5YFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuJywgY2IsIHRoaXMsIHtwcmlvcml0eTogOX0pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyA1MFxuICAgICAvLyAgICAgIGNzLnN1YnNjcmliZSgncnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiLCB0aGlzLCB7cHJpb3JpdHk6IDMwLCB2YWx1ZTogNTB9KTtcbiAgICAgLy9cbiAgICAgLy8gICAgICAvLyBPbmx5IGV4ZWN1dGUgdGhlIGNhbGxiYWNrLCBgY2JgLCBpZiB0aGUgdmFsdWUgb2YgdGhlIGBwcmljZWAgdmFyaWFibGUgaXMgZ3JlYXRlciB0aGFuIDUwXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiAnPjUwJ30pO1xuICAgICAvL1xuICAgICAvLyAgICAgIC8vIE9ubHkgZXhlY3V0ZSB0aGUgY2FsbGJhY2ssIGBjYmAsIGlmIHRoZSB2YWx1ZSBvZiB0aGUgYHByaWNlYCB2YXJpYWJsZSBpcyBldmVuXG4gICAgIC8vICAgICAgc3Vic2NyaWJlKCdydW4vdmFyaWFibGVzL3ByaWNlJywgY2IsIHRoaXMsIHtwcmlvcml0eTogMzAsIHZhbHVlOiBmdW5jdGlvbiAodmFsKSB7cmV0dXJuIHZhbCAlIDIgPT09IDB9fSk7XG5cblxuICAgIC8qKlxuICAgICAqIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiBUaGUgdG9waWMgc2hvdWxkIGluY2x1ZGUgdGhlIGZ1bGwgcGF0aCBvZiB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogZm9yIHRlYW0gcHJvamVjdHMpLCBwcm9qZWN0IGlkLCBhbmQgZ3JvdXAgbmFtZS4gKEluIG1vc3QgY2FzZXMsIGl0IGlzIHNpbXBsZXIgdG8gdXNlIHRoZSBbRXBpY2VudGVyIENoYW5uZWwgTWFuYWdlcl0oLi4vZXBpY2VudGVyLWNoYW5uZWwtbWFuYWdlci8pIGluc3RlYWQsIGluIHdoaWNoIGNhc2UgdGhpcyBpcyBjb25maWd1cmVkIGZvciB5b3UuKVxuICAgICAqXG4gICAgICogICoqRXhhbXBsZXMqKlxuICAgICAqXG4gICAgICogICAgICB2YXIgY2IgPSBmdW5jdGlvbih2YWwpIHsgY29uc29sZS5sb2codmFsLmRhdGEpOyB9O1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBhIHRvcC1sZXZlbCAncnVuJyB0b3BpY1xuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBjaGlsZHJlbiBvZiB0aGUgJ3J1bicgdG9waWMuIE5vdGUgdGhpcyB3aWxsIGFsc28gYmUgdHJpZ2dlcmVkIGZvciBjaGFuZ2VzIHRvIHJ1bi54Lnkuei5cbiAgICAgKiAgICAgIGNzLnN1YnNjcmliZSgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi8qJywgY2IpO1xuICAgICAqXG4gICAgICogICAgICAvLyBTdWJzY3JpYmUgdG8gY2hhbmdlcyBvbiBib3RoIHRoZSB0b3AtbGV2ZWwgJ3J1bicgdG9waWMgYW5kIGl0cyBjaGlsZHJlblxuICAgICAqICAgICAgY3Muc3Vic2NyaWJlKFsnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bicsXG4gICAgICogICAgICAgICAgJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4vKiddLCBjYik7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFN1YnNjcmliZSB0byBjaGFuZ2VzIG9uIGEgcGFydGljdWxhciB2YXJpYWJsZVxuICAgICAqICAgICAgc3Vic2NyaWJlKCcvYWNtZS1zaW11bGF0aW9ucy9zdXBwbHktY2hhaW4tZ2FtZS9mYWxsLXNlbWluYXIvcnVuL3ZhcmlhYmxlcy9wcmljZScsIGNiKTtcbiAgICAgKlxuICAgICAqXG4gICAgICogKipSZXR1cm4gVmFsdWUqKlxuICAgICAqXG4gICAgICogKiAqU3RyaW5nKiBSZXR1cm5zIGEgdG9rZW4geW91IGNhbiBsYXRlciB1c2UgdG8gdW5zdWJzY3JpYmUuXG4gICAgICpcbiAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAqIEBwYXJhbSAge1N0cmluZ3xBcnJheX0gICB0b3BpYyAgICBMaXN0IG9mIHRvcGljcyB0byBsaXN0ZW4gZm9yIGNoYW5nZXMgb24uXG4gICAgICogQHBhcmFtICB7RnVuY3Rpb259IGNhbGxiYWNrIENhbGxiYWNrIGZ1bmN0aW9uIHRvIGV4ZWN1dGUuIENhbGxiYWNrIGlzIGNhbGxlZCB3aXRoIHNpZ25hdHVyZSBgKGV2dCwgcGF5bG9hZCwgbWV0YWRhdGEpYC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgY29udGV4dCAgQ29udGV4dCBpbiB3aGljaCB0aGUgYGNhbGxiYWNrYCBpcyBleGVjdXRlZC5cbiAgICAgKiBAcGFyYW0gIHtPYmplY3R9ICAgb3B0aW9ucyAgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgKiBAcGFyYW0gIHtOdW1iZXJ9ICAgb3B0aW9ucy5wcmlvcml0eSAgVXNlZCB0byBjb250cm9sIG9yZGVyIG9mIG9wZXJhdGlvbnMuIERlZmF1bHRzIHRvIDAuIENhbiBiZSBhbnkgK3ZlIG9yIC12ZSBudW1iZXIuXG4gICAgICogQHBhcmFtICB7U3RyaW5nfE51bWJlcnxGdW5jdGlvbn0gICBvcHRpb25zLnZhbHVlIFRoZSBgY2FsbGJhY2tgIGlzIG9ubHkgdHJpZ2dlcmVkIGlmIHRoaXMgY29uZGl0aW9uIG1hdGNoZXMuIFNlZSBleGFtcGxlcyBmb3IgZGV0YWlscy5cbiAgICAgKiBAcmV0dXJuIHtzdHJpbmd9IFN1YnNjcmlwdGlvbiBJRFxuICAgICAqL1xuICAgIHN1YnNjcmliZTogZnVuY3Rpb24gKHRvcGljLCBjYWxsYmFjaywgY29udGV4dCwgb3B0aW9ucykge1xuXG4gICAgICAgIHZhciB0b3BpY3MgPSBbXS5jb25jYXQodG9waWMpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgc3Vic2NyaXB0aW9uSWRzID0gW107XG4gICAgICAgIHZhciBvcHRzID0gbWUuY2hhbm5lbE9wdGlvbnM7XG5cbiAgICAgICAgb3B0cy50cmFuc3BvcnQuYmF0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5lYWNoKHRvcGljcywgZnVuY3Rpb24gKGluZGV4LCB0b3BpYykge1xuICAgICAgICAgICAgICAgIHRvcGljID0gbWFrZU5hbWUob3B0cy5iYXNlLCBvcHRzLnRvcGljUmVzb2x2ZXIodG9waWMpKTtcbiAgICAgICAgICAgICAgICBzdWJzY3JpcHRpb25JZHMucHVzaChvcHRzLnRyYW5zcG9ydC5zdWJzY3JpYmUodG9waWMsIGNhbGxiYWNrKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiAoc3Vic2NyaXB0aW9uSWRzWzFdID8gc3Vic2NyaXB0aW9uSWRzIDogc3Vic2NyaXB0aW9uSWRzWzBdKTtcbiAgICB9LFxuXG4gICAgLyoqXG4gICAgICogUHVibGlzaCBkYXRhIHRvIGEgdG9waWMuXG4gICAgICpcbiAgICAgKiAqKkV4YW1wbGVzKipcbiAgICAgKlxuICAgICAqICAgICAgLy8gU2VuZCBkYXRhIHRvIGFsbCBzdWJzY3JpYmVycyBvZiB0aGUgJ3J1bicgdG9waWNcbiAgICAgKiAgICAgIGNzLnB1Ymxpc2goJy9hY21lLXNpbXVsYXRpb25zL3N1cHBseS1jaGFpbi1nYW1lL2ZhbGwtc2VtaW5hci9ydW4nLCB7IGNvbXBsZXRlZDogZmFsc2UgfSk7XG4gICAgICpcbiAgICAgKiAgICAgIC8vIFNlbmQgZGF0YSB0byBhbGwgc3Vic2NyaWJlcnMgb2YgdGhlICdydW4vdmFyaWFibGVzJyB0b3BpY1xuICAgICAqICAgICAgY3MucHVibGlzaCgnL2FjbWUtc2ltdWxhdGlvbnMvc3VwcGx5LWNoYWluLWdhbWUvZmFsbC1zZW1pbmFyL3J1bi92YXJpYWJsZXMnLCB7IHByaWNlOiA1MCB9KTtcbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHRvcGljIFRvcGljIHRvIHB1Ymxpc2ggdG8uXG4gICAgICogQHBhcmFtICB7Kn0gZGF0YSAgRGF0YSB0byBwdWJsaXNoIHRvIHRvcGljLlxuICAgICAqIEByZXR1cm4ge0FycmF5IHwgT2JqZWN0fSBSZXNwb25zZXMgdG8gcHVibGlzaGVkIGRhdGFcbiAgICAgKlxuICAgICAqL1xuICAgIHB1Ymxpc2g6IGZ1bmN0aW9uICh0b3BpYywgZGF0YSkge1xuICAgICAgICB2YXIgdG9waWNzID0gW10uY29uY2F0KHRvcGljKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIHJldHVybk9ianMgPSBbXTtcbiAgICAgICAgdmFyIG9wdHMgPSBtZS5jaGFubmVsT3B0aW9ucztcblxuXG4gICAgICAgIG9wdHMudHJhbnNwb3J0LmJhdGNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZWFjaCh0b3BpY3MsIGZ1bmN0aW9uIChpbmRleCwgdG9waWMpIHtcbiAgICAgICAgICAgICAgICB0b3BpYyA9IG1ha2VOYW1lKG9wdHMuYmFzZSwgb3B0cy50b3BpY1Jlc29sdmVyKHRvcGljKSk7XG4gICAgICAgICAgICAgICAgaWYgKHRvcGljLmNoYXJBdCh0b3BpYy5sZW5ndGggLSAxKSA9PT0gJyonKSB7XG4gICAgICAgICAgICAgICAgICAgIHRvcGljID0gdG9waWMucmVwbGFjZSgvXFwqKyQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUud2FybignWW91IGNhbiBjYW5ub3QgcHVibGlzaCB0byBjaGFubmVscyB3aXRoIHdpbGRjYXJkcy4gUHVibGlzaGluZyB0byAnLCB0b3BpYywgJ2luc3RlYWQnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuT2Jqcy5wdXNoKG9wdHMudHJhbnNwb3J0LnB1Ymxpc2godG9waWMsIGRhdGEpKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIChyZXR1cm5PYmpzWzFdID8gcmV0dXJuT2JqcyA6IHJldHVybk9ianNbMF0pO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBVbnN1YnNjcmliZSBmcm9tIGNoYW5nZXMgdG8gYSB0b3BpYy5cbiAgICAgKlxuICAgICAqICoqRXhhbXBsZSoqXG4gICAgICpcbiAgICAgKiAgICAgIGNzLnVuc3Vic2NyaWJlKCdzYW1wbGVUb2tlbicpO1xuICAgICAqXG4gICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IHRva2VuIFRoZSB0b2tlbiBmb3IgdG9waWMgaXMgcmV0dXJuZWQgd2hlbiB5b3UgaW5pdGlhbGx5IHN1YnNjcmliZS4gUGFzcyBpdCBoZXJlIHRvIHVuc3Vic2NyaWJlIGZyb20gdGhhdCB0b3BpYy5cbiAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHJlZmVyZW5jZSB0byBjdXJyZW50IGluc3RhbmNlXG4gICAgICovXG4gICAgdW5zdWJzY3JpYmU6IGZ1bmN0aW9uICh0b2tlbikge1xuICAgICAgICB0aGlzLmNoYW5uZWxPcHRpb25zLnRyYW5zcG9ydC51bnN1YnNjcmliZSh0b2tlbik7XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdGFydCBsaXN0ZW5pbmcgZm9yIGV2ZW50cyBvbiB0aGlzIGluc3RhbmNlLiBTaWduYXR1cmUgaXMgc2FtZSBhcyBmb3IgalF1ZXJ5IEV2ZW50czogaHR0cDovL2FwaS5qcXVlcnkuY29tL29uLy5cbiAgICAgKlxuICAgICAqIFN1cHBvcnRlZCBldmVudHMgYXJlOiBgY29ubmVjdGAsIGBkaXNjb25uZWN0YCwgYHN1YnNjcmliZWAsIGB1bnN1YnNjcmliZWAsIGBwdWJsaXNoYCwgYGVycm9yYC5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb24vLlxuICAgICAqL1xuICAgIG9uOiBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgJCh0aGlzKS5vbi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBTdG9wIGxpc3RlbmluZyBmb3IgZXZlbnRzIG9uIHRoaXMgaW5zdGFuY2UuIFNpZ25hdHVyZSBpcyBzYW1lIGFzIGZvciBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vb2ZmLy5cbiAgICAgKi9cbiAgICBvZmY6IGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAkKHRoaXMpLm9mZi5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH0sXG5cbiAgICAvKipcbiAgICAgKiBUcmlnZ2VyIGV2ZW50cyBhbmQgZXhlY3V0ZSBoYW5kbGVycy4gU2lnbmF0dXJlIGlzIHNhbWUgYXMgZm9yIGpRdWVyeSBFdmVudHM6IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS90cmlnZ2VyLy5cbiAgICAgKlxuICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICpcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZXZlbnQgVGhlIGV2ZW50IHR5cGUuIFNlZSBtb3JlIGRldGFpbCBhdCBqUXVlcnkgRXZlbnRzOiBodHRwOi8vYXBpLmpxdWVyeS5jb20vdHJpZ2dlci8uXG4gICAgICovXG4gICAgdHJpZ2dlcjogZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICQodGhpcykudHJpZ2dlci5hcHBseSgkKHRoaXMpLCBhcmd1bWVudHMpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQ2hhbm5lbDtcbiIsIi8qKlxuICogQGNsYXNzIENvbmZpZ3VyYXRpb25TZXJ2aWNlXG4gKlxuICogQWxsIHNlcnZpY2VzIHRha2UgaW4gYSBjb25maWd1cmF0aW9uIHNldHRpbmdzIG9iamVjdCB0byBjb25maWd1cmUgdGhlbXNlbHZlcy4gQSBKUyBoYXNoIHt9IGlzIGEgdmFsaWQgY29uZmlndXJhdGlvbiBvYmplY3QsIGJ1dCBvcHRpb25hbGx5IHlvdSBjYW4gdXNlIHRoZSBjb25maWd1cmF0aW9uIHNlcnZpY2UgdG8gdG9nZ2xlIGNvbmZpZ3MgYmFzZWQgb24gdGhlIGVudmlyb25tZW50XG4gKlxuICogQGV4YW1wbGVcbiAqICAgICB2YXIgY3MgPSByZXF1aXJlKCdjb25maWd1cmF0aW9uLXNlcnZpY2UnKSh7XG4gKiAgICAgICAgICBkZXY6IHsgLy9lbnZpcm9ubWVudFxuICAgICAgICAgICAgICAgIHBvcnQ6IDMwMDAsXG4gICAgICAgICAgICAgICAgaG9zdDogJ2xvY2FsaG9zdCcsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcHJvZDoge1xuICAgICAgICAgICAgICAgIHBvcnQ6IDgwODAsXG4gICAgICAgICAgICAgICAgaG9zdDogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICAgICAgICAgIGxvZ0xldmVsOiAnbm9uZSdcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBsb2dMZXZlbDogJ0RFQlVHJyAvL2dsb2JhbFxuICogICAgIH0pO1xuICpcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ0RFQlVHJ1xuICpcbiAqICAgICAgY3Muc2V0RW52KCdkZXYnKTtcbiAqICAgICAgY3MuZ2V0KCdsb2dMZXZlbCcpOyAvL3JldHVybnMgJ0RFQlVHJ1xuICpcbiAqICAgICAgY3Muc2V0RW52KCdwcm9kJyk7XG4gKiAgICAgIGNzLmdldCgnbG9nTGV2ZWwnKTsgLy9yZXR1cm5zICdub25lJ1xuICpcbiAqL1xuXG4ndXNlIHN0cmljdCc7XG52YXIgdXJsU2VydmljZSA9IHJlcXVpcmUoJy4vdXJsLWNvbmZpZy1zZXJ2aWNlJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIC8vVE9ETzogRW52aXJvbm1lbnRzXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICBsb2dMZXZlbDogJ05PTkUnXG4gICAgfTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgc2VydmljZU9wdGlvbnMuc2VydmVyID0gdXJsU2VydmljZShzZXJ2aWNlT3B0aW9ucy5zZXJ2ZXIpO1xuXG4gICAgcmV0dXJuIHtcblxuICAgICAgICBkYXRhOiBzZXJ2aWNlT3B0aW9ucyxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IHRoZSBlbnZpcm9ubWVudCBrZXkgdG8gZ2V0IGNvbmZpZ3VyYXRpb24gb3B0aW9ucyBmcm9tXG4gICAgICAgICAqIEBwYXJhbSB7IHN0cmluZ30gZW52XG4gICAgICAgICAqL1xuICAgICAgICBzZXRFbnY6IGZ1bmN0aW9uIChlbnYpIHtcblxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgY29uZmlndXJhdGlvbi5cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ30gcHJvcGVydHkgb3B0aW9uYWxcbiAgICAgICAgICogQHJldHVybiB7Kn0gICAgICAgICAgVmFsdWUgb2YgcHJvcGVydHkgaWYgc3BlY2lmaWVkLCB0aGUgZW50aXJlIGNvbmZpZyBvYmplY3Qgb3RoZXJ3aXNlXG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xuICAgICAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zW3Byb3BlcnR5XTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2V0IGNvbmZpZ3VyYXRpb24uXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8T2JqZWN0fSBrZXkgaWYgYSBrZXkgaXMgcHJvdmlkZWQsIHNldCBhIGtleSB0byB0aGF0IHZhbHVlLiBPdGhlcndpc2UgbWVyZ2Ugb2JqZWN0IHdpdGggY3VycmVudCBjb25maWdcbiAgICAgICAgICogQHBhcmFtICB7Kn0gdmFsdWUgIHZhbHVlIGZvciBwcm92aWRlZCBrZXlcbiAgICAgICAgICovXG4gICAgICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zW2tleV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgIH07XG59O1xuXG4iLCIvKipcbiAqICMjIERhdGEgQVBJIFNlcnZpY2VcbiAqXG4gKiBUaGUgRGF0YSBBUEkgU2VydmljZSBhbGxvd3MgeW91IHRvIGNyZWF0ZSwgYWNjZXNzLCBhbmQgbWFuaXB1bGF0ZSBkYXRhIHJlbGF0ZWQgdG8gYW55IG9mIHlvdXIgcHJvamVjdHMuIERhdGEgYXJlIG9yZ2FuaXplZCBpbiBjb2xsZWN0aW9ucy4gRWFjaCBjb2xsZWN0aW9uIGNvbnRhaW5zIGEgZG9jdW1lbnQ7IGVhY2ggZWxlbWVudCBvZiB0aGlzIHRvcC1sZXZlbCBkb2N1bWVudCBpcyBhIEpTT04gb2JqZWN0LiAoU2VlIGFkZGl0aW9uYWwgaW5mb3JtYXRpb24gb24gdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvKS4pXG4gKlxuICogQWxsIEFQSSBjYWxscyB0YWtlIGluIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgRGF0YSBBUEkgU2VydmljZSBkZWZhdWx0cy4gSW4gcGFydGljdWxhciwgdGhlcmUgYXJlIHRocmVlIHJlcXVpcmVkIHBhcmFtZXRlcnMgd2hlbiB5b3UgaW5zdGFudGlhdGUgdGhlIERhdGEgU2VydmljZTpcbiAqXG4gKiAqIGBhY2NvdW50YDogRXBpY2VudGVyIGFjY291bnQgaWQgKCoqVGVhbSBJRCoqIGZvciB0ZWFtIHByb2plY3RzLCAqKlVzZXIgSUQqKiBmb3IgcGVyc29uYWwgcHJvamVjdHMpLlxuICogKiBgcHJvamVjdGA6IEVwaWNlbnRlciBwcm9qZWN0IGlkLlxuICogKiBgcm9vdGA6IFRoZSB0aGUgbmFtZSBvZiB0aGUgY29sbGVjdGlvbi4gSWYgeW91IGhhdmUgbXVsdGlwbGUgY29sbGVjdGlvbnMgd2l0aGluIGVhY2ggb2YgeW91ciBwcm9qZWN0cywgeW91IGNhbiBhbHNvIHBhc3MgdGhlIGNvbGxlY3Rpb24gbmFtZSBhcyBhbiBvcHRpb24gZm9yIGVhY2ggY2FsbC5cbiAqXG4gKiAgICAgICB2YXIgZHMgPSBuZXcgRi5zZXJ2aWNlLkRhdGEoe1xuICogICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgICAgIHJvb3Q6ICdzdXJ2ZXktcmVzcG9uc2VzJyxcbiAqICAgICAgICAgIHNlcnZlcjogeyBob3N0OiAnYXBpLmZvcmlvLmNvbScgfVxuICogICAgICAgfSk7XG4gKiAgICAgICBkcy5zYXZlQXMoJ3VzZXIxJyxcbiAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAqICAgICAgICAgICdxdWVzdGlvbjMnOiBmYWxzZSwgJ3F1ZXN0aW9uNCc6ICdzb21ldGltZXMnIH0gKTtcbiAqICAgICAgIGRzLnNhdmVBcygndXNlcjInLFxuICogICAgICAgICAgeyAncXVlc3Rpb24xJzogMywgJ3F1ZXN0aW9uMic6IDgsXG4gKiAgICAgICAgICAncXVlc3Rpb24zJzogdHJ1ZSwgJ3F1ZXN0aW9uNCc6ICdhbHdheXMnIH0gKTtcbiAqICAgICAgIGRzLnF1ZXJ5KCcnLHsgJ3F1ZXN0aW9uMic6IHsgJyRndCc6IDl9IH0pO1xuICpcbiAqIE5vdGUgdGhhdCBpbiBhZGRpdGlvbiB0byB0aGUgYGFjY291bnRgLCBgcHJvamVjdGAsIGFuZCBgcm9vdGAsIHRoZSBEYXRhIFNlcnZpY2UgcGFyYW1ldGVycyBvcHRpb25hbGx5IGluY2x1ZGUgYSBgc2VydmVyYCBvYmplY3QsIHdob3NlIGBob3N0YCBmaWVsZCBjb250YWlucyB0aGUgVVJJIG9mIHRoZSBGb3JpbyBzZXJ2ZXIuIFRoaXMgaXMgYXV0b21hdGljYWxseSBzZXQsIGJ1dCB5b3UgY2FuIHBhc3MgaXQgZXhwbGljaXRseSBpZiBkZXNpcmVkLiBJdCBpcyBtb3N0IGNvbW1vbmx5IHVzZWQgZm9yIGNsYXJpdHkgd2hlbiB5b3UgYXJlIFtob3N0aW5nIGFuIEVwaWNlbnRlciBwcm9qZWN0IG9uIHlvdXIgb3duIHNlcnZlcl0oLi4vLi4vLi4vaG93X3RvL3NlbGZfaG9zdGluZy8pLlxuICovXG5cbid1c2Ugc3RyaWN0JztcblxudmFyIENvbmZpZ1NlcnZpY2UgPSByZXF1aXJlKCcuL2NvbmZpZ3VyYXRpb24tc2VydmljZScpO1xudmFyIHF1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uLiBSZXF1aXJlZC4gRGVmYXVsdHMgdG8gYC9gLCB0aGF0IGlzLCB0aGUgcm9vdCBsZXZlbCBvZiB5b3VyIHByb2plY3QgYXQgYGZvcmlvLmNvbS9hcHAveW91ci1hY2NvdW50LWlkL3lvdXItcHJvamVjdC1pZC9gLCBidXQgbXVzdCBiZSBzZXQgdG8gYSBjb2xsZWN0aW9uIG5hbWUuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICByb290OiAnLycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBvcGVyYXRpb25zIHRoYXQgcmVxdWlyZSBhdXRoZW50aWNhdGlvbiwgcGFzcyBpbiB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gKGRlZmF1bHRzIHRvIGVtcHR5IHN0cmluZykuIElmIHRoZSB1c2VyIGlzIGFscmVhZHkgbG9nZ2VkIGluIHRvIEVwaWNlbnRlciwgdGhlIHVzZXIgYWNjZXNzIHRva2VuIGlzIGFscmVhZHkgc2V0IGluIGEgY29va2llIGFuZCBhdXRvbWF0aWNhbGx5IGxvYWRlZCBmcm9tIHRoZXJlLiAoU2VlIFttb3JlIGJhY2tncm91bmQgb24gYWNjZXNzIHRva2Vuc10oLi4vLi4vLi4vcHJvamVjdF9hY2Nlc3MvKSkuXG4gICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgdG9rZW46IHVuZGVmaW5lZCxcblxuICAgICAgICAvL09wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXJcbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICB1cmxDb25maWcuYWNjb3VudFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50O1xuICAgIH1cbiAgICBpZiAoc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICB1cmxDb25maWcucHJvamVjdFBhdGggPSBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0O1xuICAgIH1cblxuICAgIHZhciBnZXRVUkwgPSBmdW5jdGlvbiAoa2V5LCByb290KSB7XG4gICAgICAgIGlmICghcm9vdCkge1xuICAgICAgICAgICAgcm9vdCA9IHNlcnZpY2VPcHRpb25zLnJvb3Q7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCdkYXRhJykgKyBxdXRpbC5hZGRUcmFpbGluZ1NsYXNoKHJvb3QpO1xuICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB1cmwgKz0gcXV0aWwuYWRkVHJhaWxpbmdTbGFzaChrZXkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfTtcblxuICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiBnZXRVUkxcbiAgICB9KTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2VhcmNoIGZvciBkYXRhIHdpdGhpbiBhIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFNlYXJjaGluZyB1c2luZyBjb21wYXJpc29uIG9yIGxvZ2ljYWwgb3BlcmF0b3JzIChhcyBvcHBvc2VkIHRvIGV4YWN0IG1hdGNoZXMpIHJlcXVpcmVzIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZGV0YWlscy5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZGF0YSBhc3NvY2lhdGVkIHdpdGggZG9jdW1lbnQgJ3VzZXIxJ1xuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGV4YWN0IG1hdGNoaW5nOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uIHdoZXJlICdxdWVzdGlvbjInIGlzIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogOX0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIGNvbXBhcmlzb24gb3BlcmF0b3JzOlxuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uMicgaXMgZ3JlYXRlciB0aGFuIDlcbiAgICAgICAgICogICAgICBkcy5xdWVyeSgnJywgeyAncXVlc3Rpb24yJzogeyAnJGd0JzogOX0gfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbG9naWNhbCBvcGVyYXRvcnM6XG4gICAgICAgICAqICAgICAgLy8gcmVxdWVzdCBhbGwgZG9jdW1lbnRzIGluIGNvbGxlY3Rpb25cbiAgICAgICAgICogICAgICAvLyB3aGVyZSAncXVlc3Rpb24yJyBpcyBsZXNzIHRoYW4gMTAsIGFuZCAncXVlc3Rpb24zJyBpcyBmYWxzZVxuICAgICAgICAgKiAgICAgIGRzLnF1ZXJ5KCcnLCB7ICckYW5kJzogWyB7ICdxdWVzdGlvbjInOiB7ICckbHQnOjEwfSB9LCB7ICdxdWVzdGlvbjMnOiBmYWxzZSB9XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyByZWd1bGFyIGV4cHJlc3NzaW9uczogdXNlIGFueSBQZXJsLWNvbXBhdGlibGUgcmVndWxhciBleHByZXNzaW9uc1xuICAgICAgICAgKiAgICAgIC8vIHJlcXVlc3QgYWxsIGRvY3VtZW50cyBpbiBjb2xsZWN0aW9uXG4gICAgICAgICAqICAgICAgLy8gd2hlcmUgJ3F1ZXN0aW9uNScgY29udGFpbnMgdGhlIHN0cmluZyAnLipkYXknXG4gICAgICAgICAqICAgICAgZHMucXVlcnkoJycsIHsgJ3F1ZXN0aW9uNSc6IHsgJyRyZWdleCc6ICcuKmRheScgfSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IGtleSBUaGUgbmFtZSBvZiB0aGUgZG9jdW1lbnQgdG8gc2VhcmNoLiBQYXNzIHRoZSBlbXB0eSBzdHJpbmcgKCcnKSB0byBzZWFyY2ggdGhlIGVudGlyZSBjb2xsZWN0aW9uLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcXVlcnkgVGhlIHF1ZXJ5IG9iamVjdC4gRm9yIGV4YWN0IG1hdGNoaW5nLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgZmllbGQgdmFsdWUgdG8gbWF0Y2guIEZvciBtYXRjaGluZyBiYXNlZCBvbiBjb21wYXJpc29uLCB0aGlzIG9iamVjdCBjb250YWlucyB0aGUgZmllbGQgbmFtZSBhbmQgdGhlIGNvbXBhcmlzb24gZXhwcmVzc2lvbi4gRm9yIG1hdGNoaW5nIGJhc2VkIG9uIGxvZ2ljYWwgb3BlcmF0b3JzLCB0aGlzIG9iamVjdCBjb250YWlucyBhbiBleHByZXNzaW9uIHVzaW5nIE1vbmdvREIgc3ludGF4LiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvI3NlYXJjaGluZykgZm9yIGFkZGl0aW9uYWwgZXhhbXBsZXMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRwdXRNb2RpZmllciAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIHF1ZXJ5OiBmdW5jdGlvbiAoa2V5LCBxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IHE6IHF1ZXJ5IH0sIG91dHB1dE1vZGlmaWVyKTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5LCBodHRwT3B0aW9ucy5yb290KTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChwYXJhbXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBkYXRhIGluIGFuIGFub255bW91cyBkb2N1bWVudCB3aXRoaW4gdGhlIGNvbGxlY3Rpb24uXG4gICAgICAgICAqXG4gICAgICAgICAqIFRoZSBgcm9vdGAgb2YgdGhlIGNvbGxlY3Rpb24gbXVzdCBiZSBzcGVjaWZpZWQuIEJ5IGRlZmF1bHQgdGhlIGByb290YCBpcyB0YWtlbiBmcm9tIHRoZSBEYXRhIFNlcnZpY2UgY29uZmlndXJhdGlvbiBvcHRpb25zOyB5b3UgY2FuIGFsc28gcGFzcyB0aGUgYHJvb3RgIHRvIHRoZSBgc2F2ZWAgY2FsbCBleHBsaWNpdGx5IGJ5IG92ZXJyaWRpbmcgdGhlIG9wdGlvbnMgKHRoaXJkIHBhcmFtZXRlcikuXG4gICAgICAgICAqXG4gICAgICAgICAqIChBZGRpdGlvbmFsIGJhY2tncm91bmQ6IERvY3VtZW50cyBhcmUgdG9wLWxldmVsIGVsZW1lbnRzIHdpdGhpbiBhIGNvbGxlY3Rpb24uIENvbGxlY3Rpb25zIG11c3QgYmUgdW5pcXVlIHdpdGhpbiB0aGlzIGFjY291bnQgKHRlYW0gb3IgcGVyc29uYWwgYWNjb3VudCkgYW5kIHByb2plY3QgYW5kIGFyZSBzZXQgd2l0aCB0aGUgYHJvb3RgIGZpZWxkIGluIHRoZSBgb3B0aW9uYCBwYXJhbWV0ZXIuIFNlZSB0aGUgdW5kZXJseWluZyBbRGF0YSBBUEldKC4uLy4uLy4uL3Jlc3RfYXBpcy9kYXRhX2FwaS8pIGZvciBtb3JlIGluZm9ybWF0aW9uLiBUaGUgYHNhdmVgIG1ldGhvZCBpcyBtYWtpbmcgYSBgUE9TVGAgcmVxdWVzdC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gQ3JlYXRlIGEgbmV3IGRvY3VtZW50LCB3aXRoIG9uZSBlbGVtZW50LCBhdCB0aGUgZGVmYXVsdCByb290IGxldmVsXG4gICAgICAgICAqICAgICAgZHMuc2F2ZSgncXVlc3Rpb24xJywgJ3llcycpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSBhIG5ldyBkb2N1bWVudCwgd2l0aCB0d28gZWxlbWVudHMsIGF0IHRoZSBkZWZhdWx0IHJvb3QgbGV2ZWxcbiAgICAgICAgICogICAgICBkcy5zYXZlKHsgcXVlc3Rpb24xOid5ZXMnLCBxdWVzdGlvbjI6IDMyIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSBhIG5ldyBkb2N1bWVudCwgd2l0aCB0d28gZWxlbWVudHMsIGF0IGAvc3R1ZGVudHMvYFxuICAgICAgICAgKiAgICAgIGRzLnNhdmUoeyBuYW1lOidKb2huJywgY2xhc3NOYW1lOiAnQ1MxMDEnIH0sIHsgcm9vdDogJ3N0dWRlbnRzJyB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICpcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd8T2JqZWN0fSBrZXkgSWYgYGtleWAgaXMgYSBzdHJpbmcsIGl0IGlzIHRoZSBpZCBvZiB0aGUgZWxlbWVudCB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIElmIGBrZXlgIGlzIGFuIG9iamVjdCwgdGhlIG9iamVjdCBpcyB0aGUgZGF0YSB0byBzYXZlIChjcmVhdGUpIGluIHRoaXMgZG9jdW1lbnQuIEluIGJvdGggY2FzZXMsIHRoZSBpZCBmb3IgdGhlIGRvY3VtZW50IGlzIGdlbmVyYXRlZCBhdXRvbWF0aWNhbGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLiBJZiBga2V5YCBpcyBhIHN0cmluZywgdGhpcyBpcyB0aGUgdmFsdWUgdG8gc2F2ZS4gSWYgYGtleWAgaXMgYW4gb2JqZWN0LCB0aGUgdmFsdWUocykgdG8gc2F2ZSBhcmUgYWxyZWFkeSBwYXJ0IG9mIGBrZXlgIGFuZCB0aGlzIGFyZ3VtZW50IGlzIG5vdCByZXF1aXJlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy4gSWYgeW91IHdhbnQgdG8gb3ZlcnJpZGUgdGhlIGRlZmF1bHQgYHJvb3RgIG9mIHRoZSBjb2xsZWN0aW9uLCBkbyBzbyBoZXJlLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICBhdHRycyA9IGtleTtcbiAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsdWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKCcnLCBodHRwT3B0aW9ucy5yb290KTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChhdHRycywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIChjcmVhdGUgb3IgcmVwbGFjZSkgZGF0YSBpbiBhIG5hbWVkIGRvY3VtZW50IG9yIGVsZW1lbnQgd2l0aGluIHRoZSBjb2xsZWN0aW9uLiBcbiAgICAgICAgICogXG4gICAgICAgICAqIFRoZSBgcm9vdGAgb2YgdGhlIGNvbGxlY3Rpb24gbXVzdCBiZSBzcGVjaWZpZWQuIEJ5IGRlZmF1bHQgdGhlIGByb290YCBpcyB0YWtlbiBmcm9tIHRoZSBEYXRhIFNlcnZpY2UgY29uZmlndXJhdGlvbiBvcHRpb25zOyB5b3UgY2FuIGFsc28gcGFzcyB0aGUgYHJvb3RgIHRvIHRoZSBgc2F2ZUFzYCBjYWxsIGV4cGxpY2l0bHkgYnkgb3ZlcnJpZGluZyB0aGUgb3B0aW9ucyAodGhpcmQgcGFyYW1ldGVyKS5cbiAgICAgICAgICpcbiAgICAgICAgICogT3B0aW9uYWxseSwgdGhlIG5hbWVkIGRvY3VtZW50IG9yIGVsZW1lbnQgY2FuIGluY2x1ZGUgcGF0aCBpbmZvcm1hdGlvbiwgc28gdGhhdCB5b3UgYXJlIHNhdmluZyBqdXN0IHBhcnQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKlxuICAgICAgICAgKiAoQWRkaXRpb25hbCBiYWNrZ3JvdW5kOiBEb2N1bWVudHMgYXJlIHRvcC1sZXZlbCBlbGVtZW50cyB3aXRoaW4gYSBjb2xsZWN0aW9uLiBDb2xsZWN0aW9ucyBtdXN0IGJlIHVuaXF1ZSB3aXRoaW4gdGhpcyBhY2NvdW50ICh0ZWFtIG9yIHBlcnNvbmFsIGFjY291bnQpIGFuZCBwcm9qZWN0IGFuZCBhcmUgc2V0IHdpdGggdGhlIGByb290YCBmaWVsZCBpbiB0aGUgYG9wdGlvbmAgcGFyYW1ldGVyLiBTZWUgdGhlIHVuZGVybHlpbmcgW0RhdGEgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvZGF0YV9hcGkvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi4gVGhlIGBzYXZlQXNgIG1ldGhvZCBpcyBtYWtpbmcgYSBgUFVUYCByZXF1ZXN0LilcbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBDcmVhdGUgKG9yIHJlcGxhY2UpIHRoZSBgdXNlcjFgIGRvY3VtZW50IGF0IHRoZSBkZWZhdWx0IHJvb3QgbGV2ZWwuXG4gICAgICAgICAqICAgICAgLy8gTm90ZSB0aGF0IHRoaXMgcmVwbGFjZXMgYW55IGV4aXN0aW5nIGNvbnRlbnQgaW4gdGhlIGB1c2VyMWAgZG9jdW1lbnQuXG4gICAgICAgICAqICAgICAgZHMuc2F2ZUFzKCd1c2VyMScsXG4gICAgICAgICAqICAgICAgICAgIHsgJ3F1ZXN0aW9uMSc6IDIsICdxdWVzdGlvbjInOiAxMCxcbiAgICAgICAgICogICAgICAgICAgICdxdWVzdGlvbjMnOiBmYWxzZSwgJ3F1ZXN0aW9uNCc6ICdzb21ldGltZXMnIH0gKTtcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBDcmVhdGUgKG9yIHJlcGxhY2UpIHRoZSBgc3R1ZGVudDFgIGRvY3VtZW50IGF0IHRoZSBgc3R1ZGVudHNgIHJvb3QsIFxuICAgICAgICAgKiAgICAgIC8vIHRoYXQgaXMsIHRoZSBkYXRhIGF0IGAvc3R1ZGVudHMvc3R1ZGVudDEvYC5cbiAgICAgICAgICogICAgICAvLyBOb3RlIHRoYXQgdGhpcyByZXBsYWNlcyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgYC9zdHVkZW50cy9zdHVkZW50MS9gIGRvY3VtZW50LlxuICAgICAgICAgKiAgICAgIC8vIEhvd2V2ZXIsIHRoaXMgd2lsbCBrZWVwIGV4aXN0aW5nIGNvbnRlbnQgaW4gb3RoZXIgcGF0aHMgb2YgdGhpcyBjb2xsZWN0aW9uLlxuICAgICAgICAgKiAgICAgIC8vIEZvciBleGFtcGxlLCB0aGUgZGF0YSBhdCBgL3N0dWRlbnRzL3N0dWRlbnQyL2AgaXMgdW5jaGFuZ2VkIGJ5IHRoaXMgY2FsbC5cbiAgICAgICAgICogICAgICBkcy5zYXZlQXMoJ3N0dWRlbnQxJyxcbiAgICAgICAgICogICAgICAgICAgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSxcbiAgICAgICAgICogICAgICAgICAgeyByb290OiAnc3R1ZGVudHMnIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIENyZWF0ZSAob3IgcmVwbGFjZSkgdGhlIGBtZ210MTAwL2dyb3VwQmAgZG9jdW1lbnQgYXQgdGhlIGBteWNsYXNzZXNgIHJvb3QsXG4gICAgICAgICAqICAgICAgLy8gdGhhdCBpcywgdGhlIGRhdGEgYXQgYC9teWNsYXNzZXMvbWdtdDEwMC9ncm91cEIvYC5cbiAgICAgICAgICogICAgICAvLyBOb3RlIHRoYXQgdGhpcyByZXBsYWNlcyBhbnkgZXhpc3RpbmcgY29udGVudCBpbiB0aGUgYC9teWNsYXNzZXMvbWdtdDEwMC9ncm91cEIvYCBkb2N1bWVudC5cbiAgICAgICAgICogICAgICAvLyBIb3dldmVyLCB0aGlzIHdpbGwga2VlcCBleGlzdGluZyBjb250ZW50IGluIG90aGVyIHBhdGhzIG9mIHRoaXMgY29sbGVjdGlvbi5cbiAgICAgICAgICogICAgICAvLyBGb3IgZXhhbXBsZSwgdGhlIGRhdGEgYXQgYC9teWNsYXNzZXMvbWdtdDEwMC9ncm91cEEvYCBpcyB1bmNoYW5nZWQgYnkgdGhpcyBjYWxsLlxuICAgICAgICAgKiAgICAgIGRzLnNhdmVBcygnbWdtdDEwMC9ncm91cEInLFxuICAgICAgICAgKiAgICAgICAgICB7IHNjZW5hcmlvWWVhcjogJzIwMTUnIH0sXG4gICAgICAgICAqICAgICAgICAgIHsgcm9vdDogJ215Y2xhc3NlcycgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqXG4gICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgSWQgb2YgdGhlIGRvY3VtZW50LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKSBUaGUgZGF0YSB0byBzYXZlLCBpbiBrZXk6dmFsdWUgcGFpcnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuIElmIHlvdSB3YW50IHRvIG92ZXJyaWRlIHRoZSBkZWZhdWx0IGByb290YCBvZiB0aGUgY29sbGVjdGlvbiwgZG8gc28gaGVyZS5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX0gXG4gICAgICAgICAqL1xuICAgICAgICBzYXZlQXM6IGZ1bmN0aW9uIChrZXksIHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnB1dCh2YWx1ZSwgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgZGF0YSBmb3IgYSBzcGVjaWZpYyBkb2N1bWVudCBvciBmaWVsZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBkcy5sb2FkKCd1c2VyMScpO1xuICAgICAgICAgKiAgICAgIGRzLmxvYWQoJ3VzZXIxL3F1ZXN0aW9uMycpO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd8T2JqZWN0fSBrZXkgVGhlIGlkIG9mIHRoZSBkYXRhIHRvIHJldHVybi4gQ2FuIGJlIHRoZSBpZCBvZiBhIGRvY3VtZW50LCBvciBhIHBhdGggdG8gZGF0YSB3aXRoaW4gdGhhdCBkb2N1bWVudC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChrZXksIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgaHR0cE9wdGlvbnMudXJsID0gZ2V0VVJMKGtleSwgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBkYXRhIGZyb20gY29sbGVjdGlvbi4gT25seSBkb2N1bWVudHMgKHRvcC1sZXZlbCBlbGVtZW50cyBpbiBlYWNoIGNvbGxlY3Rpb24pIGNhbiBiZSBkZWxldGVkLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgZHMucmVtb3ZlKCd1c2VyMScpO1xuICAgICAgICAgKlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xBcnJheX0ga2V5cyBUaGUgaWQgb2YgdGhlIGRvY3VtZW50IHRvIHJlbW92ZSBmcm9tIHRoaXMgY29sbGVjdGlvbiwgb3IgYW4gYXJyYXkgb2Ygc3VjaCBpZHMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9IFxuICAgICAgICAgKi9cbiAgICAgICAgcmVtb3ZlOiBmdW5jdGlvbiAoa2V5cywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIHZhciBwYXJhbXM7XG4gICAgICAgICAgICBpZiAoJC5pc0FycmF5KGtleXMpKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zID0geyBpZDoga2V5cyB9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMgPSAnJztcbiAgICAgICAgICAgICAgICBodHRwT3B0aW9ucy51cmwgPSBnZXRVUkwoa2V5cywgaHR0cE9wdGlvbnMucm9vdCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5kZWxldGUocGFyYW1zLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBFcGljZW50ZXIgZG9lc24ndCBhbGxvdyBudWtpbmcgY29sbGVjdGlvbnNcbiAgICAgICAgLy8gICAgIC8qKlxuICAgICAgICAvLyAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgLy8gICAgICAqIEByZXR1cm4gbnVsbFxuICAgICAgICAvLyAgICAgICovXG4gICAgICAgIC8vICAgICBkZXN0cm95OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAvLyAgICAgICAgIHJldHVybiB0aGlzLnJlbW92ZSgnJywgb3B0aW9ucyk7XG4gICAgICAgIC8vICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKlxuICogIyMgR3JvdXAgQVBJIEFkYXB0ZXJcbiAqXG4gKiBUaGUgR3JvdXAgQVBJIEFkYXB0ZXIgcHJvdmlkZXMgbWV0aG9kcyB0byBsb29rIHVwLCBjcmVhdGUsIGNoYW5nZSBvciByZW1vdmUgaW5mb3JtYXRpb24gYWJvdXQgZ3JvdXBzIGluIGEgcHJvamVjdC4gSXQgaXMgYmFzZWQgb24gcXVlcnkgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW0dyb3VwIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL3VzZXJfbWFuYWdlbWVudC9ncm91cC8pLlxuICpcbiAqIFRoaXMgaXMgb25seSBuZWVkZWQgZm9yIEF1dGhlbnRpY2F0ZWQgcHJvamVjdHMsIHRoYXQgaXMsIHRlYW0gcHJvamVjdHMgd2l0aCBbZW5kIHVzZXJzIGFuZCBncm91cHNdKC4uLy4uLy4uL2dyb3Vwc19hbmRfZW5kX3VzZXJzLykuXG4gKlxuICogICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLkdyb3VwKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBzRm9yUHJvamVjdCh7IGFjY291bnQ6ICdhY21lJywgcHJvamVjdDogJ3NhbXBsZScgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2VydmljZVV0aWxzID0gcmVxdWlyZSgnLi9zZXJ2aWNlLXV0aWxzJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgb2JqZWN0QXNzaWduID0gcmVxdWlyZSgnb2JqZWN0LWFzc2lnbicpO1xuXG52YXIgYXBpRW5kcG9pbnQgPSAnZ3JvdXAvbG9jYWwnO1xuXG52YXIgR3JvdXBTZXJ2aWNlID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEVwaWNlbnRlciBhY2NvdW50IG5hbWUuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge3N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIHByb2plY3QgbmFtZS4gRGVmYXVsdHMgdG8gdW5kZWZpbmVkLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHNlcnZpY2VVdGlscy5nZXREZWZhdWx0T3B0aW9ucyhkZWZhdWx0cywgY29uZmlnLCB7IGFwaUVuZHBvaW50OiBhcGlFbmRwb2ludCB9KTtcbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9IHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydDtcbiAgICBkZWxldGUgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0O1xuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucywgc2VydmljZU9wdGlvbnMpO1xuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgaW5mb3JtYXRpb24gZm9yIGEgZ3JvdXAgb3IgbXVsdGlwbGUgZ3JvdXBzLlxuICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBwYXJhbXMgb2JqZWN0IHdpdGggcXVlcnkgcGFyYW1ldGVyc1xuICAgICAgICAqIEBwYXRhbSB7c3RyaW5nfSBwYXJhbXMucSBwYXJ0aWFsIG1hdGNoIGZvciBuYW1lLCBvcmdhbml6YXRpb24gb3IgZXZlbnQuXG4gICAgICAgICogQHBhdGFtIHtzdHJpbmd9IHBhcmFtcy5hY2NvdW50IEVwaWNlbnRlcidzIFRlYW0gSURcbiAgICAgICAgKiBAcGF0YW0ge3N0cmluZ30gcGFyYW1zLnByb2plY3QgRXBpY2VudGVyJ3MgUHJvamVjdCBJRFxuICAgICAgICAqIEBwYXRhbSB7c3RyaW5nfSBwYXJhbXMubmFtZSBFcGljZW50ZXIncyBHcm91cCBOYW1lXG4gICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRHcm91cHM6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vZ3JvdXBJRCBpcyBwYXJ0IG9mIHRoZSBVUkxcbiAgICAgICAgICAgIC8vcSwgYWNjb3VudCBhbmQgcHJvamVjdCBhcmUgcGFydCBvZiB0aGUgcXVlcnkgc3RyaW5nXG4gICAgICAgICAgICB2YXIgZmluYWxPcHRzID0gb2JqZWN0QXNzaWduKHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZmluYWxQYXJhbXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBmaW5hbE9wdHMudXJsID0gc2VydmljZVV0aWxzLmdldEFwaVVybChhcGlFbmRwb2ludCArICcvJyArIHBhcmFtcywgZmluYWxPcHRzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZmluYWxQYXJhbXMgPSBwYXJhbXM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmluYWxQYXJhbXMsIGZpbmFsT3B0cyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIG9iamVjdEFzc2lnbih0aGlzLCBwdWJsaWNBUEkpO1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBHcm91cFNlcnZpY2U7XG4iLCIvKipcbiAqXG4gKiAjIyBJbnRyb3NwZWN0aW9uIEFQSSBTZXJ2aWNlXG4gKlxuICogVGhlIEludHJvc3BlY3Rpb24gQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byB2aWV3IGEgbGlzdCBvZiB0aGUgdmFyaWFibGVzIGFuZCBvcGVyYXRpb25zIGluIGEgbW9kZWwuIFR5cGljYWxseSB1c2VkIGluIGNvbmp1bmN0aW9uIHdpdGggdGhlIFtSdW4gQVBJIFNlcnZpY2VdKC4uL3J1bi1hcGktc2VydmljZS8pLlxuICpcbiAqIFRoZSBJbnRyb3NwZWN0aW9uIEFQSSBTZXJ2aWNlIGlzIG5vdCBhdmFpbGFibGUgZm9yIEZvcmlvIFNpbUxhbmcuXG4gKlxuICogICAgICAgdmFyIGludHJvID0gbmV3IEYuc2VydmljZS5JbnRyb3NwZWN0KHtcbiAqICAgICAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICogICAgICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnXG4gKiAgICAgICB9KTtcbiAqICAgICAgIGludHJvLmJ5TW9kZWwoJ3N1cHBseS1jaGFpbi5weScpLnRoZW4oZnVuY3Rpb24oZGF0YSl7IC4uLiB9KTtcbiAqICAgICAgIGludHJvLmJ5UnVuSUQoJzJiNGQ4ZjcxLTVjMzQtNDM1YS04YzE2LTlkZTY3NGFiNzJlNicpLnRoZW4oZnVuY3Rpb24oZGF0YSl7IC4uLiB9KTtcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcblxudmFyIGFwaUVuZHBvaW50ID0gJ21vZGVsL2ludHJvc3BlY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGb3IgcHJvamVjdHMgdGhhdCByZXF1aXJlIGF1dGhlbnRpY2F0aW9uLCBwYXNzIGluIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiAoZGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nKS4gSWYgdGhlIHVzZXIgaXMgYWxyZWFkeSBsb2dnZWQgaW4gdG8gRXBpY2VudGVyLCB0aGUgdXNlciBhY2Nlc3MgdG9rZW4gaXMgYWxyZWFkeSBzZXQgaW4gYSBjb29raWUgYW5kIGF1dG9tYXRpY2FsbHkgbG9hZGVkIGZyb20gdGhlcmUuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHNlZSBbQXV0aGVudGljYXRpb24gQVBJIFNlcnZpY2VdKC4uL2F1dGgtYXBpLXNlcnZpY2UvKSBmb3IgZ2V0dGluZyB0b2tlbnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB0b2tlbjogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgYWNjb3VudDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgcHJvamVjdCBpZC4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgfTtcblxuICAgIHZhciBzZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGF2YWlsYWJsZSB2YXJpYWJsZXMgYW5kIG9wZXJhdGlvbnMgZm9yIGEgZ2l2ZW4gbW9kZWwgZmlsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZTogVGhpcyBkb2VzIG5vdCB3b3JrIGZvciBhbnkgbW9kZWwgd2hpY2ggcmVxdWlyZXMgYWRkaXRpb25hbCBwYXJhbWV0ZXJzLCBzdWNoIGFzIGBmaWxlc2AuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgaW50cm8uYnlNb2RlbCgnYWJjLnZtZicpXG4gICAgICAgICAqICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICogICAgICAgICAgICAgIC8vIGRhdGEgY29udGFpbnMgYW4gb2JqZWN0IHdpdGggYXZhaWxhYmxlIGZ1bmN0aW9ucyAodXNlZCB3aXRoIG9wZXJhdGlvbnMgQVBJKSBhbmQgYXZhaWxhYmxlIHZhcmlhYmxlcyAodXNlZCB3aXRoIHZhcmlhYmxlcyBBUEkpXG4gICAgICAgICAqICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLmZ1bmN0aW9ucyk7XG4gICAgICAgICAqICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhLnZhcmlhYmxlcyk7XG4gICAgICAgICAqICAgICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0gIHtTdHJpbmd9IG1vZGVsRmlsZSBOYW1lIG9mIHRoZSBtb2RlbCBmaWxlIHRvIGludHJvc3BlY3QuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIGJ5TW9kZWw6IGZ1bmN0aW9uIChtb2RlbEZpbGUsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBvcHRzID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGlmICghb3B0cy5hY2NvdW50IHx8ICFvcHRzLnByb2plY3QpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0FjY291bnQgYW5kIHByb2plY3QgYXJlIHJlcXVpcmVkIHdoZW4gdXNpbmcgaW50cm9zcGVjdCNieU1vZGVsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIW1vZGVsRmlsZSkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignbW9kZWxGaWxlIGlzIHJlcXVpcmVkIHdoZW4gdXNpbmcgaW50cm9zcGVjdCNieU1vZGVsJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgdXJsID0geyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIFtvcHRzLmFjY291bnQsIG9wdHMucHJvamVjdCwgbW9kZWxGaWxlXS5qb2luKCcvJykgfTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgdXJsKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBHZXQgdGhlIGF2YWlsYWJsZSB2YXJpYWJsZXMgYW5kIG9wZXJhdGlvbnMgZm9yIGEgZ2l2ZW4gbW9kZWwgZmlsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZTogVGhpcyBkb2VzIG5vdCB3b3JrIGZvciBhbnkgbW9kZWwgd2hpY2ggcmVxdWlyZXMgYWRkaXRpb25hbCBwYXJhbWV0ZXJzIHN1Y2ggYXMgYGZpbGVzYC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBpbnRyby5ieVJ1bklEKCcyYjRkOGY3MS01YzM0LTQzNWEtOGMxNi05ZGU2NzRhYjcyZTYnKVxuICAgICAgICAgKiAgICAgICAgICAudGhlbihmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICAvLyBkYXRhIGNvbnRhaW5zIGFuIG9iamVjdCB3aXRoIGF2YWlsYWJsZSBmdW5jdGlvbnMgKHVzZWQgd2l0aCBvcGVyYXRpb25zIEFQSSkgYW5kIGF2YWlsYWJsZSB2YXJpYWJsZXMgKHVzZWQgd2l0aCB2YXJpYWJsZXMgQVBJKVxuICAgICAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS5mdW5jdGlvbnMpO1xuICAgICAgICAgKiAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YS52YXJpYWJsZXMpO1xuICAgICAgICAgKiAgICAgICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtICB7U3RyaW5nfSBydW5JRCBJZCBvZiB0aGUgcnVuIHRvIGludHJvc3BlY3QuXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfSBcbiAgICAgICAgICovXG4gICAgICAgIGJ5UnVuSUQ6IGZ1bmN0aW9uIChydW5JRCwgb3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKCFydW5JRCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcigncnVuSUQgaXMgcmVxdWlyZWQgd2hlbiB1c2luZyBpbnRyb3NwZWN0I2J5TW9kZWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciB1cmwgPSB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcnVuSUQgfTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucywgdXJsKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldCgnJywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjIE1lbWJlciBBUEkgQWRhcHRlclxuICpcbiAqIFRoZSBNZW1iZXIgQVBJIEFkYXB0ZXIgcHJvdmlkZXMgbWV0aG9kcyB0byBsb29rIHVwIGluZm9ybWF0aW9uIGFib3V0IGVuZCB1c2VycyBmb3IgeW91ciBwcm9qZWN0IGFuZCBob3cgdGhleSBhcmUgZGl2aWRlZCBhY3Jvc3MgZ3JvdXBzLiBJdCBpcyBiYXNlZCBvbiBxdWVyeSBjYXBhYmlsaXRpZXMgb2YgdGhlIHVuZGVybHlpbmcgUkVTVGZ1bCBbTWVtYmVyIEFQSV0oLi4vLi4vLi4vcmVzdF9hcGlzL3VzZXJfbWFuYWdlbWVudC9tZW1iZXIvKS5cbiAqXG4gKiBUaGlzIGlzIG9ubHkgbmVlZGVkIGZvciBBdXRoZW50aWNhdGVkIHByb2plY3RzLCB0aGF0IGlzLCB0ZWFtIHByb2plY3RzIHdpdGggW2VuZCB1c2VycyBhbmQgZ3JvdXBzXSguLi8uLi8uLi9ncm91cHNfYW5kX2VuZF91c2Vycy8pLiBGb3IgZXhhbXBsZSwgaWYgc29tZSBvZiB5b3VyIGVuZCB1c2VycyBhcmUgZmFjaWxpdGF0b3JzLCBvciBpZiB5b3VyIGVuZCB1c2VycyBzaG91bGQgYmUgdHJlYXRlZCBkaWZmZXJlbnRseSBiYXNlZCBvbiB3aGljaCBncm91cCB0aGV5IGFyZSBpbiwgdXNlIHRoZSBNZW1iZXIgQVBJIHRvIGZpbmQgdGhhdCBpbmZvcm1hdGlvbi5cbiAqXG4gKiAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBzRm9yVXNlcih7IHVzZXJJZDogJ2I2YjMxM2EzLWFiODQtNDc5Yy1iYWVhLTIwNmY2YmZmMzM3JyB9KTtcbiAqICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKHsgZ3JvdXBJZDogJzAwYjUzMzA4LTk4MzMtNDdmMi1iMjFlLTEyNzhjMDdkNTNiOCcgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBhcGlFbmRwb2ludCA9ICdtZW1iZXIvbG9jYWwnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG4gICAgICAgIC8qKlxuICAgICAgICAgKiBFcGljZW50ZXIgdXNlciBpZC4gRGVmYXVsdHMgdG8gYSBibGFuayBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtzdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICB1c2VySWQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogRXBpY2VudGVyIGdyb3VwIGlkLiBEZWZhdWx0cyB0byBhIGJsYW5rIHN0cmluZy4gTm90ZSB0aGF0IHRoaXMgaXMgdGhlIGdyb3VwICppZCosIG5vdCB0aGUgZ3JvdXAgKm5hbWUqLlxuICAgICAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgZ3JvdXBJZDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPcHRpb25zIHRvIHBhc3Mgb24gdG8gdGhlIHVuZGVybHlpbmcgdHJhbnNwb3J0IGxheWVyLiBBbGwganF1ZXJ5LmFqYXggb3B0aW9ucyBhdCBodHRwOi8vYXBpLmpxdWVyeS5jb20valF1ZXJ5LmFqYXgvIGFyZSBhdmFpbGFibGUuIERlZmF1bHRzIHRvIGVtcHR5IG9iamVjdC5cbiAgICAgICAgICogQHR5cGUge29iamVjdH1cbiAgICAgICAgICovXG4gICAgICAgIHRyYW5zcG9ydDoge31cbiAgICB9O1xuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgdmFyIHVybENvbmZpZyA9IG5ldyBDb25maWdTZXJ2aWNlKHNlcnZpY2VPcHRpb25zKS5nZXQoJ3NlcnZlcicpO1xuXG4gICAgdmFyIHRyYW5zcG9ydE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0LCB7XG4gICAgICAgIHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zLCBzZXJ2aWNlT3B0aW9ucyk7XG5cbiAgICB2YXIgZ2V0RmluYWxQYXJhbXMgPSBmdW5jdGlvbiAocGFyYW1zKSB7XG4gICAgICAgIGlmICh0eXBlb2YgcGFyYW1zID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgcmV0dXJuICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCBwYXJhbXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucztcbiAgICB9O1xuXG4gICAgdmFyIHBhdGNoVXNlckFjdGl2ZUZpZWxkID0gZnVuY3Rpb24gKHBhcmFtcywgYWN0aXZlLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7XG4gICAgICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHBhcmFtcy5ncm91cElkICsgJy8nICsgcGFyYW1zLnVzZXJJZFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gaHR0cC5wYXRjaCh7IGFjdGl2ZTogYWN0aXZlIH0sIGh0dHBPcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGFsbCBvZiB0aGUgZ3JvdXAgbWVtYmVyc2hpcHMgZm9yIG9uZSBlbmQgdXNlci4gVGhlIG1lbWJlcnNoaXAgZGV0YWlscyBhcmUgcmV0dXJuZWQgaW4gYW4gYXJyYXksIHdpdGggb25lIGVsZW1lbnQgKGdyb3VwIHJlY29yZCkgZm9yIGVhY2ggZ3JvdXAgdG8gd2hpY2ggdGhlIGVuZCB1c2VyIGJlbG9uZ3MuXG4gICAgICAgICpcbiAgICAgICAgKiBJbiB0aGUgbWVtYmVyc2hpcCBhcnJheSwgZWFjaCBncm91cCByZWNvcmQgaW5jbHVkZXMgdGhlIGdyb3VwIGlkLCBwcm9qZWN0IGlkLCBhY2NvdW50ICh0ZWFtKSBpZCwgYW5kIGFuIGFycmF5IG9mIG1lbWJlcnMuIEhvd2V2ZXIsIG9ubHkgdGhlIHVzZXIgd2hvc2UgdXNlcklkIGlzIGluY2x1ZGVkIGluIHRoZSBjYWxsIGlzIGxpc3RlZCBpbiB0aGUgbWVtYmVycyBhcnJheSAocmVnYXJkbGVzcyBvZiB3aGV0aGVyIHRoZXJlIGFyZSBvdGhlciBtZW1iZXJzIGluIHRoaXMgZ3JvdXApLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKCc0MjgzNmQ0Yi01YjYxLTRmZTQtODBlYi0zMTM2ZTk1NmVlNWMnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbihtZW1iZXJzaGlwcyl7XG4gICAgICAgICogICAgICAgICAgICAgICBmb3IgKHZhciBpPTA7IGk8bWVtYmVyc2hpcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhtZW1iZXJzaGlwc1tpXS5ncm91cElkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIH1cbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cHNGb3JVc2VyKHsgdXNlcklkOiAnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd8b2JqZWN0fSBwYXJhbXMgVGhlIHVzZXIgaWQgZm9yIHRoZSBlbmQgdXNlci4gQWx0ZXJuYXRpdmVseSwgYW4gb2JqZWN0IHdpdGggZmllbGQgYHVzZXJJZGAgYW5kIHZhbHVlIHRoZSB1c2VyIGlkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICovXG5cbiAgICAgICAgZ2V0R3JvdXBzRm9yVXNlcjogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgaXNTdHJpbmcgPSB0eXBlb2YgcGFyYW1zID09PSAnc3RyaW5nJztcbiAgICAgICAgICAgIHZhciBvYmpQYXJhbXMgPSBnZXRGaW5hbFBhcmFtcyhwYXJhbXMpO1xuICAgICAgICAgICAgaWYgKCFpc1N0cmluZyAmJiAhb2JqUGFyYW1zLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gdXNlcklkIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdldFBhcm1zID0gaXNTdHJpbmcgPyB7IHVzZXJJZDogcGFyYW1zIH0gOiBfcGljayhvYmpQYXJhbXMsICd1c2VySWQnKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChnZXRQYXJtcywgaHR0cE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgb25lIGdyb3VwLCBpbmNsdWRpbmcgYW4gYXJyYXkgb2YgYWxsIGl0cyBtZW1iZXJzLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5nZXRHcm91cERldGFpbHMoJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGdyb3VwKXtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGZvciAodmFyIGk9MDsgaTxncm91cC5tZW1iZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZ3JvdXAubWVtYmVyc1tpXS51c2VyTmFtZSk7XG4gICAgICAgICogICAgICAgICAgICAgICB9XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgbWEuZ2V0R3JvdXBEZXRhaWxzKHsgZ3JvdXBJZDogJzgwMjU3YTI1LWFhMTAtNDk1OS05NjhiLWZkMDUzOTAxZjcyZicgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdH0gcGFyYW1zIFRoZSBncm91cCBpZC4gQWx0ZXJuYXRpdmVseSwgYW4gb2JqZWN0IHdpdGggZmllbGQgYGdyb3VwSWRgIGFuZCB2YWx1ZSB0aGUgZ3JvdXAgaWQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRHcm91cERldGFpbHM6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHBhcmFtcyA9PT0gJ3N0cmluZyc7XG4gICAgICAgICAgICB2YXIgb2JqUGFyYW1zID0gZ2V0RmluYWxQYXJhbXMocGFyYW1zKTtcbiAgICAgICAgICAgIGlmICghaXNTdHJpbmcgJiYgIW9ialBhcmFtcy5ncm91cElkKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBncm91cElkIHNwZWNpZmllZC4nKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGdyb3VwSWQgPSBpc1N0cmluZyA/IHBhcmFtcyA6IG9ialBhcmFtcy5ncm91cElkO1xuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgZ3JvdXBJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoe30sIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBTZXQgYSBwYXJ0aWN1bGFyIGVuZCB1c2VyIGFzIGBhY3RpdmVgLiBBY3RpdmUgZW5kIHVzZXJzIGNhbiBiZSBhc3NpZ25lZCB0byBbd29ybGRzXSguLi93b3JsZC1tYW5hZ2VyLykgaW4gbXVsdGlwbGF5ZXIgZ2FtZXMgZHVyaW5nIGF1dG9tYXRpYyBhc3NpZ25tZW50LlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciBtYSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKHsgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJyB9KTtcbiAgICAgICAgKiAgICAgICBtYS5tYWtlVXNlckFjdGl2ZSh7IHVzZXJJZDogJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiAnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBUaGUgZW5kIHVzZXIgYW5kIGdyb3VwIGluZm9ybWF0aW9uLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMudXNlcklkIFRoZSBpZCBvZiB0aGUgZW5kIHVzZXIgdG8gbWFrZSBhY3RpdmUuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5ncm91cElkIFRoZSBpZCBvZiB0aGUgZ3JvdXAgdG8gd2hpY2ggdGhpcyBlbmQgdXNlciBiZWxvbmdzLCBhbmQgaW4gd2hpY2ggdGhlIGVuZCB1c2VyIHNob3VsZCBiZWNvbWUgYWN0aXZlLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbWFrZVVzZXJBY3RpdmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRjaFVzZXJBY3RpdmVGaWVsZChwYXJhbXMsIHRydWUsIG9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFNldCBhIHBhcnRpY3VsYXIgZW5kIHVzZXIgYXMgYGluYWN0aXZlYC4gSW5hY3RpdmUgZW5kIHVzZXJzIGFyZSBub3QgYXNzaWduZWQgdG8gW3dvcmxkc10oLi4vd29ybGQtbWFuYWdlci8pIGluIG11bHRpcGxheWVyIGdhbWVzIGR1cmluZyBhdXRvbWF0aWMgYXNzaWdubWVudC5cbiAgICAgICAgKlxuICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICB2YXIgbWEgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcih7IHRva2VuOiAndXNlci1vci1wcm9qZWN0LWFjY2Vzcy10b2tlbicgfSk7XG4gICAgICAgICogICAgICAgbWEubWFrZVVzZXJJbmFjdGl2ZSh7IHVzZXJJZDogJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICAgICAgICBncm91cElkOiAnODAyNTdhMjUtYWExMC00OTU5LTk2OGItZmQwNTM5MDFmNzJmJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBUaGUgZW5kIHVzZXIgYW5kIGdyb3VwIGluZm9ybWF0aW9uLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMudXNlcklkIFRoZSBpZCBvZiB0aGUgZW5kIHVzZXIgdG8gbWFrZSBpbmFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmdyb3VwSWQgVGhlIGlkIG9mIHRoZSBncm91cCB0byB3aGljaCB0aGlzIGVuZCB1c2VyIGJlbG9uZ3MsIGFuZCBpbiB3aGljaCB0aGUgZW5kIHVzZXIgc2hvdWxkIGJlY29tZSBpbmFjdGl2ZS5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIG1ha2VVc2VySW5hY3RpdmU6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHJldHVybiBwYXRjaFVzZXJBY3RpdmVGaWVsZChwYXJhbXMsIGZhbHNlLCBvcHRpb25zKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIi8qKlxuICpcbiAqICMjIFJ1biBBUEkgU2VydmljZVxuICpcbiAqIFRoZSBSdW4gQVBJIFNlcnZpY2UgYWxsb3dzIHlvdSB0byBwZXJmb3JtIGNvbW1vbiB0YXNrcyBhcm91bmQgY3JlYXRpbmcgYW5kIHVwZGF0aW5nIHJ1bnMsIHZhcmlhYmxlcywgYW5kIGRhdGEuXG4gKlxuICogV2hlbiBidWlsZGluZyBpbnRlcmZhY2VzIHRvIHNob3cgcnVuIG9uZSBhdCBhIHRpbWUgKGFzIGZvciBzdGFuZGFyZCBlbmQgdXNlcnMpLCB0eXBpY2FsbHkgeW91IGZpcnN0IGluc3RhbnRpYXRlIGEgW1J1biBNYW5hZ2VyXSguLi9ydW4tbWFuYWdlci8pIGFuZCB0aGVuIGFjY2VzcyB0aGUgUnVuIFNlcnZpY2UgdGhhdCBpcyBhdXRvbWF0aWNhbGx5IHBhcnQgb2YgdGhlIG1hbmFnZXIsIHJhdGhlciB0aGFuIGluc3RhbnRpYXRpbmcgdGhlIFJ1biBTZXJ2aWNlIGRpcmVjdGx5LiBUaGlzIGlzIGJlY2F1c2UgdGhlIFJ1biBNYW5hZ2VyIGdpdmVzIHlvdSBjb250cm9sIG92ZXIgcnVuIGNyZWF0aW9uIGRlcGVuZGluZyBvbiBydW4gc3RhdGVzLlxuICpcbiAqIEhvd2V2ZXIsIG1hbnkgb2YgdGhlIEVwaWNlbnRlciBzYW1wbGUgcHJvamVjdHMgdXNlIGEgUnVuIFNlcnZpY2UsIGJlY2F1c2UgZ2VuZXJhbGx5IHRoZSBzYW1wbGUgcHJvamVjdHMgYXJlIHBsYXllZCBpbiBvbmUgZW5kIHVzZXIgc2Vzc2lvbiBhbmQgZG9uJ3QgY2FyZSBhYm91dCBydW4gc3RhdGVzIG9yIFtydW4gc3RyYXRlZ2llc10oLi4vc3RyYXRlZ2llcy8pLiBUaGUgUnVuIEFQSSBTZXJ2aWNlIGlzIGFsc28gdXNlZnVsIGZvciBidWlsZGluZyBhbiBpbnRlcmZhY2UgZm9yIGEgZmFjaWxpdGF0b3IsIGJlY2F1c2UgaXQgbWFrZXMgaXQgZWFzeSB0byBsaXN0IGRhdGEgYWNyb3NzIG11bHRpcGxlIHJ1bnMgKHVzaW5nIHRoZSBgZmlsdGVyKClgIGFuZCBgcXVlcnkoKWAgbWV0aG9kcykuXG4gKlxuICogVG8gdXNlIHRoZSBSdW4gQVBJIFNlcnZpY2UsIGluc3RhbnRpYXRlIGl0IGJ5IHBhc3NpbmcgaW46XG4gKlxuICogKiBgYWNjb3VudGA6IEVwaWNlbnRlciBhY2NvdW50IGlkICgqKlRlYW0gSUQqKiBmb3IgdGVhbSBwcm9qZWN0cywgKipVc2VyIElEKiogZm9yIHBlcnNvbmFsIHByb2plY3RzKS5cbiAqICogYHByb2plY3RgOiBFcGljZW50ZXIgcHJvamVjdCBpZC5cbiAqXG4gKiBGb3IgZXhhbXBsZSxcbiAqXG4gKiAgICAgICB2YXIgcnMgPSBuZXcgRi5zZXJ2aWNlLlJ1bih7XG4gKiAgICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAqICAgICAgICAgICAgcHJvamVjdDogJ3N1cHBseS1jaGFpbi1nYW1lJyxcbiAqICAgICAgfSk7XG4gKiAgICAgIHJzLmNyZWF0ZSgnc3VwcGx5X2NoYWluX2dhbWUucHknKS50aGVuKGZ1bmN0aW9uKHJ1bikge1xuICogICAgICAgICAgICAgcnMuZG8oJ3NvbWVPcGVyYXRpb24nKTtcbiAqICAgICAgfSk7XG4gKlxuICpcbiAqIEFkZGl0aW9uYWxseSwgYWxsIEFQSSBjYWxscyB0YWtlIGluIGFuIFwib3B0aW9uc1wiIG9iamVjdCBhcyB0aGUgbGFzdCBwYXJhbWV0ZXIuIFRoZSBvcHRpb25zIGNhbiBiZSB1c2VkIHRvIGV4dGVuZC9vdmVycmlkZSB0aGUgUnVuIEFQSSBTZXJ2aWNlIGRlZmF1bHRzIGxpc3RlZCBiZWxvdy5cbiAqXG4gKiBOb3RlIHRoYXQgaW4gYWRkaXRpb24gdG8gdGhlIGBhY2NvdW50YCwgYHByb2plY3RgLCBhbmQgYG1vZGVsYCwgdGhlIFJ1biBTZXJ2aWNlIHBhcmFtZXRlcnMgb3B0aW9uYWxseSBpbmNsdWRlIGEgYHNlcnZlcmAgb2JqZWN0LCB3aG9zZSBgaG9zdGAgZmllbGQgY29udGFpbnMgdGhlIFVSSSBvZiB0aGUgRm9yaW8gc2VydmVyLiBUaGlzIGlzIGF1dG9tYXRpY2FsbHkgc2V0LCBidXQgeW91IGNhbiBwYXNzIGl0IGV4cGxpY2l0bHkgaWYgZGVzaXJlZC4gSXQgaXMgbW9zdCBjb21tb25seSB1c2VkIGZvciBjbGFyaXR5IHdoZW4geW91IGFyZSBbaG9zdGluZyBhbiBFcGljZW50ZXIgcHJvamVjdCBvbiB5b3VyIG93biBzZXJ2ZXJdKC4uLy4uLy4uL2hvd190by9zZWxmX2hvc3RpbmcvKS5cbiAqXG4gKiAgICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe1xuICogICAgICAgICAgIHJ1bjoge1xuICogICAgICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5X2NoYWluX2dhbWUucHknLFxuICogICAgICAgICAgICAgICBzZXJ2ZXI6IHsgaG9zdDogJ2FwaS5mb3Jpby5jb20nIH1cbiAqICAgICAgICAgICB9XG4gKiAgICAgICB9KTtcbiAqICAgICAgIHJtLmdldFJ1bigpXG4gKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocnVuKSB7XG4gKiAgICAgICAgICAgICAgIC8vIHRoZSBSdW5NYW5hZ2VyLnJ1biBjb250YWlucyB0aGUgaW5zdGFudGlhdGVkIFJ1biBTZXJ2aWNlLFxuICogICAgICAgICAgICAgICAvLyBzbyBhbnkgUnVuIFNlcnZpY2UgbWV0aG9kIGlzIHZhbGlkIGhlcmVcbiAqICAgICAgICAgICAgICAgdmFyIHJzID0gcm0ucnVuO1xuICogICAgICAgICAgICAgICBycy5kbygnc29tZU9wZXJhdGlvbicpO1xuICogICAgICAgfSlcbiAqXG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBydXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcnVuLXV0aWwnKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBWYXJpYWJsZXNTZXJ2aWNlID0gcmVxdWlyZSgnLi92YXJpYWJsZXMtYXBpLXNlcnZpY2UnKTtcbnZhciBJbnRyb3NwZWN0aW9uU2VydmljZSA9IHJlcXVpcmUoJy4vaW50cm9zcGVjdGlvbi1hcGktc2VydmljZScpO1xudmFyIFNlc3Npb25NYW5hZ2VyID0gcmVxdWlyZSgnLi4vc3RvcmUvc2Vzc2lvbi1tYW5hZ2VyJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuIElmIGxlZnQgdW5kZWZpbmVkLCB0YWtlbiBmcm9tIHRoZSBVUkwuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBwcm9qZWN0OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciBydW5zLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZW5pZW5jZSBhbGlhcyBmb3IgZmlsdGVyLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgaWQ6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBGbGFnIGRldGVybWluZXMgaWYgYFgtQXV0b1Jlc3RvcmU6IHRydWVgIGhlYWRlciBpcyBzZW50IHRvIEVwaWNlbnRlci4gRGVmYXVsdHMgdG8gYHRydWVgLlxuICAgICAgICAgKiBAdHlwZSB7Ym9vbGVhbn1cbiAgICAgICAgICovXG4gICAgICAgIGF1dG9SZXN0b3JlOiB0cnVlLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBjb21wbGV0ZXMgc3VjY2Vzc2Z1bGx5LiBEZWZhdWx0cyB0byBgJC5ub29wYC5cbiAgICAgICAgICogQHR5cGUge2Z1bmN0aW9ufVxuICAgICAgICAgKi9cbiAgICAgICAgc3VjY2VzczogJC5ub29wLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDYWxsZWQgd2hlbiB0aGUgY2FsbCBmYWlscy4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIGVycm9yOiAkLm5vb3AsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy5pZCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBzZXJ2aWNlT3B0aW9ucy5pZDtcbiAgICB9XG5cbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmFjY291bnQpIHtcbiAgICAgICAgdXJsQ29uZmlnLmFjY291bnRQYXRoID0gc2VydmljZU9wdGlvbnMuYWNjb3VudDtcbiAgICB9XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnByb2plY3QpIHtcbiAgICAgICAgdXJsQ29uZmlnLnByb2plY3RQYXRoID0gc2VydmljZU9wdGlvbnMucHJvamVjdDtcbiAgICB9XG5cbiAgICB1cmxDb25maWcuZmlsdGVyID0gJzsnO1xuICAgIHVybENvbmZpZy5nZXRGaWx0ZXJVUkwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1cmwgPSB1cmxDb25maWcuZ2V0QVBJUGF0aCgncnVuJyk7XG4gICAgICAgIHZhciBmaWx0ZXIgPSBxdXRpbC50b01hdHJpeEZvcm1hdChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpO1xuXG4gICAgICAgIGlmIChmaWx0ZXIpIHtcbiAgICAgICAgICAgIHVybCArPSBmaWx0ZXIgKyAnLyc7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9O1xuXG4gICAgdXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIGZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmZpbHRlcjtcbiAgICAgICAgLy8gVGhlIHNlbWljb2xvbiBzZXBhcmF0ZWQgZmlsdGVyIGlzIHVzZWQgd2hlbiBmaWx0ZXIgaXMgYW4gb2JqZWN0XG4gICAgICAgIHZhciBpc0ZpbHRlclJ1bklkID0gZmlsdGVyICYmICQudHlwZShmaWx0ZXIpID09PSAnc3RyaW5nJztcbiAgICAgICAgaWYgKHNlcnZpY2VPcHRpb25zLmF1dG9SZXN0b3JlICYmIGlzRmlsdGVyUnVuSWQpIHtcbiAgICAgICAgICAgIC8vIEJ5IGRlZmF1bHQgYXV0b3JlcGxheSB0aGUgcnVuIGJ5IHNlbmRpbmcgdGhpcyBoZWFkZXIgdG8gZXBpY2VudGVyXG4gICAgICAgICAgICAvLyBodHRwczovL2ZvcmlvLmNvbS9lcGljZW50ZXIvZG9jcy9wdWJsaWMvcmVzdF9hcGlzL2FnZ3JlZ2F0ZV9ydW5fYXBpLyNyZXRyaWV2aW5nXG4gICAgICAgICAgICB2YXIgYXV0b3Jlc3RvcmVPcHRzID0ge1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtQXV0b1Jlc3RvcmUnOiB0cnVlXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCBhdXRvcmVzdG9yZU9wdHMsIG9wdGlvbnMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfTtcblxuICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0RmlsdGVyVVJMXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuICAgIGh0dHAuc3BsaXRHZXQgPSBydXRpbC5zcGxpdEdldEZhY3RvcnkoaHR0cE9wdGlvbnMpO1xuXG4gICAgdmFyIHNldEZpbHRlck9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmlkKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZmlsdGVyIHNwZWNpZmllZCB0byBhcHBseSBvcGVyYXRpb25zIGFnYWluc3QnKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQXN5bmNBUEkgPSB7XG4gICAgICAgIHVybENvbmZpZzogdXJsQ29uZmlnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDcmVhdGUgYSBuZXcgcnVuLlxuICAgICAgICAgKlxuICAgICAgICAgKiBOT1RFOiBUeXBpY2FsbHkgdGhpcyBpcyBub3QgdXNlZCEgVXNlIGBSdW5NYW5hZ2VyLmdldFJ1bigpYCB3aXRoIGEgYHN0cmF0ZWd5YCBvZiBgYWx3YXlzLW5ld2AsIG9yIHVzZSBgUnVuTWFuYWdlci5yZXNldCgpYC4gU2VlIFtSdW4gTWFuYWdlcl0oLi4vcnVuLW1hbmFnZXIvKSBmb3IgbW9yZSBkZXRhaWxzLlxuICAgICAgICAgKlxuICAgICAgICAgKiAgKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICBycy5jcmVhdGUoJ2hlbGxvX3dvcmxkLmpsJyk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHBhcmFtcyBJZiBhIHN0cmluZywgdGhlIG5hbWUgb2YgdGhlIHByaW1hcnkgW21vZGVsIGZpbGVdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pLiBUaGlzIGlzIHRoZSBvbmUgZmlsZSBpbiB0aGUgcHJvamVjdCB0aGF0IGV4cGxpY2l0bHkgZXhwb3NlcyB2YXJpYWJsZXMgYW5kIG1ldGhvZHMsIGFuZCBpdCBtdXN0IGJlIHN0b3JlZCBpbiB0aGUgTW9kZWwgZm9sZGVyIG9mIHlvdXIgRXBpY2VudGVyIHByb2plY3QuIElmIGFuIG9iamVjdCwgbWF5IGluY2x1ZGUgYG1vZGVsYCwgYHNjb3BlYCwgYW5kIGBmaWxlc2AuIChTZWUgdGhlIFtSdW4gTWFuYWdlcl0oLi4vcnVuX21hbmFnZXIvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbiBvbiBgc2NvcGVgIGFuZCBgZmlsZXNgLilcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGNyZWF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgncnVuJykgfSk7XG4gICAgICAgICAgICB2YXIgcnVuQXBpUGFyYW1zID0gWydtb2RlbCcsICdzY29wZScsICdmaWxlcyddO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbXMgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBqdXN0IHRoZSBtb2RlbCBuYW1lXG4gICAgICAgICAgICAgICAgcGFyYW1zID0geyBtb2RlbDogcGFyYW1zIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIHdoaXRlbGlzdCB0aGUgZmllbGRzIHRoYXQgd2UgYWN0dWFsbHkgY2FuIHNlbmQgdG8gdGhlIGFwaVxuICAgICAgICAgICAgICAgIHBhcmFtcyA9IF9waWNrKHBhcmFtcywgcnVuQXBpUGFyYW1zKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBjcmVhdGVPcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgICAgICBjcmVhdGVPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSByZXNwb25zZS5pZDsgLy9hbGwgZnV0dXJlIGNoYWluZWQgY2FsbHMgdG8gb3BlcmF0ZSBvbiB0aGlzIGlkXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuaWQgPSByZXNwb25zZS5pZDtcbiAgICAgICAgICAgICAgICByZXR1cm4gb2xkU3VjY2Vzcy5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIGNyZWF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBUaGUgZWxlbWVudHMgb2YgdGhlIGBxc2Agb2JqZWN0IGFyZSBBTkRlZCB0b2dldGhlciB3aXRoaW4gYSBzaW5nbGUgY2FsbCB0byBgLnF1ZXJ5KClgLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIHJldHVybnMgcnVucyB3aXRoIHNhdmVkID0gdHJ1ZSBhbmQgdmFyaWFibGVzLnByaWNlID4gMSxcbiAgICAgICAgICogICAgICAvLyB3aGVyZSB2YXJpYWJsZXMucHJpY2UgaGFzIGJlZW4gcGVyc2lzdGVkIChyZWNvcmRlZClcbiAgICAgICAgICogICAgICAvLyBpbiB0aGUgbW9kZWwuXG4gICAgICAgICAqICAgICBycy5xdWVyeSh7XG4gICAgICAgICAqICAgICAgICAgICdzYXZlZCc6ICd0cnVlJyxcbiAgICAgICAgICogICAgICAgICAgJy5wcmljZSc6ICc+MSdcbiAgICAgICAgICogICAgICAgfSxcbiAgICAgICAgICogICAgICAge1xuICAgICAgICAgKiAgICAgICAgICBzdGFydHJlY29yZDogMixcbiAgICAgICAgICogICAgICAgICAgZW5kcmVjb3JkOiA1XG4gICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gcXMgUXVlcnkgb2JqZWN0LiBFYWNoIGtleSBjYW4gYmUgYSBwcm9wZXJ0eSBvZiB0aGUgcnVuIG9yIHRoZSBuYW1lIG9mIHZhcmlhYmxlIHRoYXQgaGFzIGJlZW4gc2F2ZWQgaW4gdGhlIHJ1biAocHJlZmFjZWQgYnkgYHZhcmlhYmxlcy5gKS4gRWFjaCB2YWx1ZSBjYW4gYmUgYSBsaXRlcmFsIHZhbHVlLCBvciBhIGNvbXBhcmlzb24gb3BlcmF0b3IgYW5kIHZhbHVlLiAoU2VlIFttb3JlIG9uIGZpbHRlcmluZ10oLi4vLi4vLi4vcmVzdF9hcGlzL2FnZ3JlZ2F0ZV9ydW5fYXBpLyNmaWx0ZXJzKSBhbGxvd2VkIGluIHRoZSB1bmRlcmx5aW5nIFJ1biBBUEkuKSBRdWVyeWluZyBmb3IgdmFyaWFibGVzIGlzIGF2YWlsYWJsZSBmb3IgcnVucyBbaW4gbWVtb3J5XSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBhbmQgZm9yIHJ1bnMgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkgaWYgdGhlIHZhcmlhYmxlcyBhcmUgcGVyc2lzdGVkIChlLmcuIHRoYXQgaGF2ZSBiZWVuIGByZWNvcmRgZWQgaW4geW91ciBKdWxpYSBtb2RlbCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvdXRwdXRNb2RpZmllciAoT3B0aW9uYWwpIEF2YWlsYWJsZSBmaWVsZHMgaW5jbHVkZTogYHN0YXJ0cmVjb3JkYCwgYGVuZHJlY29yZGAsIGBzb3J0YCwgYW5kIGBkaXJlY3Rpb25gIChgYXNjYCBvciBgZGVzY2ApLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxcywgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHFzOyAvL3Nob3VsZG4ndCBiZSBhYmxlIHRvIG92ZXItcmlkZVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zID0gdXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQob3V0cHV0TW9kaWZpZXIsIGh0dHBPcHRpb25zKS50aGVuKGZ1bmN0aW9uIChyKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICgkLmlzUGxhaW5PYmplY3QocikgJiYgT2JqZWN0LmtleXMocikubGVuZ3RoID09PSAwKSA/IFtdIDogcjtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBSZXR1cm5zIHBhcnRpY3VsYXIgcnVucywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxc2Agb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiBTaW1pbGFyIHRvIGAucXVlcnkoKWAuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXIgRmlsdGVyIG9iamVjdC4gRWFjaCBrZXkgY2FuIGJlIGEgcHJvcGVydHkgb2YgdGhlIHJ1biBvciB0aGUgbmFtZSBvZiB2YXJpYWJsZSB0aGF0IGhhcyBiZWVuIHNhdmVkIGluIHRoZSBydW4gKHByZWZhY2VkIGJ5IGB2YXJpYWJsZXMuYCkuIEVhY2ggdmFsdWUgY2FuIGJlIGEgbGl0ZXJhbCB2YWx1ZSwgb3IgYSBjb21wYXJpc29uIG9wZXJhdG9yIGFuZCB2YWx1ZS4gKFNlZSBbbW9yZSBvbiBmaWx0ZXJpbmddKC4uLy4uLy4uL3Jlc3RfYXBpcy9hZ2dyZWdhdGVfcnVuX2FwaS8jZmlsdGVycykgYWxsb3dlZCBpbiB0aGUgdW5kZXJseWluZyBSdW4gQVBJLikgRmlsdGVyaW5nIGZvciB2YXJpYWJsZXMgaXMgYXZhaWxhYmxlIGZvciBydW5zIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpIGFuZCBmb3IgcnVucyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tbWVtb3J5KSBpZiB0aGUgdmFyaWFibGVzIGFyZSBwZXJzaXN0ZWQgKGUuZy4gdGhhdCBoYXZlIGJlZW4gYHJlY29yZGBlZCBpbiB5b3VyIEp1bGlhIG1vZGVsKS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6IGZ1bmN0aW9uIChmaWx0ZXIsIG91dHB1dE1vZGlmaWVyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHNlcnZpY2VPcHRpb25zLmZpbHRlcikpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXJ2aWNlT3B0aW9ucy5maWx0ZXIsIGZpbHRlcik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IGZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICBodHRwT3B0aW9ucyA9IHVybENvbmZpZy5hZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5zcGxpdEdldChvdXRwdXRNb2RpZmllciwgaHR0cE9wdGlvbnMpLnRoZW4oZnVuY3Rpb24gKHIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKCQuaXNQbGFpbk9iamVjdChyKSAmJiBPYmplY3Qua2V5cyhyKS5sZW5ndGggPT09IDApID8gW10gOiByO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIEdldCBkYXRhIGZvciBhIHNwZWNpZmljIHJ1bi4gVGhpcyBpbmNsdWRlcyBzdGFuZGFyZCBydW4gZGF0YSBzdWNoIGFzIHRoZSBhY2NvdW50LCBtb2RlbCwgcHJvamVjdCwgYW5kIGNyZWF0ZWQgYW5kIGxhc3QgbW9kaWZpZWQgZGF0ZXMuIFRvIHJlcXVlc3Qgc3BlY2lmaWMgbW9kZWwgdmFyaWFibGVzLCBwYXNzIHRoZW0gYXMgcGFydCBvZiB0aGUgYGZpbHRlcnNgIHBhcmFtZXRlci5cbiAgICAgICAgICpcbiAgICAgICAgICogTm90ZSB0aGF0IGlmIHRoZSBydW4gaXMgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSksIGFueSBtb2RlbCB2YXJpYWJsZXMgYXJlIGF2YWlsYWJsZTsgaWYgdGhlIHJ1biBpcyBbaW4gdGhlIGRhdGFiYXNlXSguLi8uLi8uLi9ydW5fcGVyc2lzdGVuY2UvI3J1bnMtaW4tZGIpLCBvbmx5IG1vZGVsIHZhcmlhYmxlcyB0aGF0IGhhdmUgYmVlbiBwZXJzaXN0ZWQgJm1kYXNoOyB0aGF0IGlzLCBgcmVjb3JkYGVkIGluIHlvdXIgSnVsaWEgbW9kZWwgJm1kYXNoOyBhcmUgYXZhaWxhYmxlLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgcnMubG9hZCgnYmI1ODk2NzctZDQ3Ni00OTcxLWE2OGUtMGM1OGQxOTFlNDUwJywgeyBpbmNsdWRlOiBbJy5wcmljZScsICcuc2FsZXMnXSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHJ1bklEIFRoZSBydW4gaWQuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBmaWx0ZXJzIChPcHRpb25hbCkgT2JqZWN0IGNvbnRhaW5pbmcgZmlsdGVycyBhbmQgb3BlcmF0aW9uIG1vZGlmaWVycy4gVXNlIGtleSBgaW5jbHVkZWAgdG8gbGlzdCBtb2RlbCB2YXJpYWJsZXMgdGhhdCB5b3Ugd2FudCB0byBpbmNsdWRlIGluIHRoZSByZXNwb25zZS4gT3RoZXIgYXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocnVuSUQsIGZpbHRlcnMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChydW5JRCkge1xuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHJ1bklEOyAvL3Nob3VsZG4ndCBiZSBhYmxlIHRvIG92ZXItcmlkZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgICAgIGh0dHBPcHRpb25zID0gdXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLmdldChmaWx0ZXJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cblxuICAgICAgICAvKipcbiAgICAgICAgICogU2F2ZSBhdHRyaWJ1dGVzIChkYXRhLCBtb2RlbCB2YXJpYWJsZXMpIG9mIHRoZSBydW4uXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgLy8gYWRkICdjb21wbGV0ZWQnIGZpZWxkIHRvIHJ1biByZWNvcmRcbiAgICAgICAgICogICAgIHJzLnNhdmUoeyBjb21wbGV0ZWQ6IHRydWUgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAvLyB1cGRhdGUgJ3NhdmVkJyBmaWVsZCBvZiBydW4gcmVjb3JkLCBhbmQgdXBkYXRlIHZhbHVlcyBvZiBtb2RlbCB2YXJpYWJsZXMgZm9yIHRoaXMgcnVuXG4gICAgICAgICAqICAgICBycy5zYXZlKHsgc2F2ZWQ6IHRydWUsIHZhcmlhYmxlczogeyBhOiAyMywgYjogMjMgfSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgVGhlIHJ1biBkYXRhIGFuZCB2YXJpYWJsZXMgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMudmFyaWFibGVzIE1vZGVsIHZhcmlhYmxlcyBtdXN0IGJlIGluY2x1ZGVkIGluIGEgYHZhcmlhYmxlc2AgZmllbGQgd2l0aGluIHRoZSBgYXR0cmlidXRlc2Agb2JqZWN0LiAoT3RoZXJ3aXNlIHRoZXkgYXJlIHRyZWF0ZWQgYXMgcnVuIGRhdGEgYW5kIGFkZGVkIHRvIHRoZSBydW4gcmVjb3JkIGRpcmVjdGx5LilcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIHNhdmU6IGZ1bmN0aW9uIChhdHRyaWJ1dGVzLCBvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgc2V0RmlsdGVyT3JUaHJvd0Vycm9yKGh0dHBPcHRpb25zKTtcbiAgICAgICAgICAgIHJldHVybiBodHRwLnBhdGNoKGF0dHJpYnV0ZXMsIGh0dHBPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBhIG1ldGhvZCBmcm9tIHRoZSBtb2RlbC5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBtZXRob2QgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogVGhlIGBwYXJhbXNgIGFyZ3VtZW50IGlzIG5vcm1hbGx5IGFuIGFycmF5IG9mIGFyZ3VtZW50cyB0byB0aGUgYG9wZXJhdGlvbmAuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXkuXG4gICAgICAgICAqXG4gICAgICAgICAqIE5vdGUgdGhhdCB5b3UgY2FuIGNvbWJpbmUgdGhlIGBvcGVyYXRpb25gIGFuZCBgcGFyYW1zYCBhcmd1bWVudHMgaW50byBhIHNpbmdsZSBvYmplY3QgaWYgeW91IHByZWZlciwgYXMgaW4gdGhlIGxhc3QgZXhhbXBsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlcyoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic29sdmVcIiB0YWtlcyBubyBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLmRvKCdzb2x2ZScpO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImVjaG9cIiB0YWtlcyBvbmUgYXJndW1lbnQsIGEgc3RyaW5nXG4gICAgICAgICAqICAgICBycy5kbygnZWNobycsIFsnaGVsbG8nXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwiZWNob1wiIHRha2VzIG9uZSBhcmd1bWVudCwgYSBzdHJpbmdcbiAgICAgICAgICogICAgIHJzLmRvKCdlY2hvJywgJ2hlbGxvJyk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kIFwic3VtQXJyYXlcIiB0YWtlcyBvbmUgYXJndW1lbnQsIGFuIGFycmF5XG4gICAgICAgICAqICAgICBycy5kbygnc3VtQXJyYXknLCBbWzQsMiwxXV0pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZCBcImFkZFwiIHRha2VzIHR3byBhcmd1bWVudHMsIGJvdGggaW50ZWdlcnNcbiAgICAgICAgICogICAgIHJzLmRvKHsgbmFtZTonYWRkJywgcGFyYW1zOlsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge1N0cmluZ30gb3BlcmF0aW9uIE5hbWUgb2YgbWV0aG9kLlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fSBwYXJhbXMgKE9wdGlvbmFsKSBBbnkgcGFyYW1ldGVycyB0aGUgb3BlcmF0aW9uIHRha2VzLCBwYXNzZWQgYXMgYW4gYXJyYXkuIEluIHRoZSBzcGVjaWFsIGNhc2Ugd2hlcmUgYG9wZXJhdGlvbmAgb25seSB0YWtlcyBvbmUgYXJndW1lbnQsIHlvdSBhcmUgbm90IHJlcXVpcmVkIHRvIHB1dCB0aGF0IGFyZ3VtZW50IGludG8gYW4gYXJyYXksIGFuZCBjYW4ganVzdCBwYXNzIGl0IGRpcmVjdGx5LlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgZG86IGZ1bmN0aW9uIChvcGVyYXRpb24sIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coJ2RvJywgb3BlcmF0aW9uLCBwYXJhbXMpO1xuICAgICAgICAgICAgdmFyIG9wc0FyZ3M7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnM7XG4gICAgICAgICAgICBpZiAob3B0aW9ucykge1xuICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSkge1xuICAgICAgICAgICAgICAgIG9wc0FyZ3MgPSBudWxsO1xuICAgICAgICAgICAgICAgIHBvc3RPcHRpb25zID0gcGFyYW1zO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvcHNBcmdzID0gcGFyYW1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9uLCBvcHNBcmdzKTtcbiAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgcG9zdE9wdGlvbnMpO1xuXG4gICAgICAgICAgICBzZXRGaWx0ZXJPclRocm93RXJyb3IoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcHJtcyA9IChyZXN1bHQuYXJnc1swXS5sZW5ndGggJiYgKHJlc3VsdC5hcmdzWzBdICE9PSBudWxsICYmIHJlc3VsdC5hcmdzWzBdICE9PSB1bmRlZmluZWQpKSA/IHJlc3VsdC5hcmdzWzBdIDogW107XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHsgYXJndW1lbnRzOiBwcm1zIH0sICQuZXh0ZW5kKHRydWUsIHt9LCBodHRwT3B0aW9ucywge1xuICAgICAgICAgICAgICAgIHVybDogdXJsQ29uZmlnLmdldEZpbHRlclVSTCgpICsgJ29wZXJhdGlvbnMvJyArIHJlc3VsdC5vcHNbMF0gKyAnLydcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBzZXZlcmFsIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwsIHNlcXVlbnRpYWxseS5cbiAgICAgICAgICpcbiAgICAgICAgICogRGVwZW5kaW5nIG9uIHRoZSBsYW5ndWFnZSBpbiB3aGljaCB5b3UgaGF2ZSB3cml0dGVuIHlvdXIgbW9kZWwsIHRoZSBtZXRob2RzIG1heSBuZWVkIHRvIGJlIGV4cG9zZWQgKGUuZy4gYGV4cG9ydGAgZm9yIGEgSnVsaWEgbW9kZWwpIGluIHRoZSBtb2RlbCBmaWxlIGluIG9yZGVyIHRvIGJlIGNhbGxlZCB0aHJvdWdoIHRoZSBBUEkuIFNlZSBbV3JpdGluZyB5b3VyIE1vZGVsXSguLi8uLi8uLi93cml0aW5nX3lvdXJfbW9kZWwvKSkuXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZXMqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJpbml0aWFsaXplXCIgYW5kIFwic29sdmVcIiBkbyBub3QgdGFrZSBhbnkgYXJndW1lbnRzXG4gICAgICAgICAqICAgICBycy5zZXJpYWwoWydpbml0aWFsaXplJywgJ3NvbHZlJ10pO1xuICAgICAgICAgKiAgICAgIC8vIG1ldGhvZHMgXCJpbml0XCIgYW5kIFwicmVzZXRcIiB0YWtlIHR3byBhcmd1bWVudHMgZWFjaFxuICAgICAgICAgKiAgICAgcnMuc2VyaWFsKFsgIHsgbmFtZTogJ2luaXQnLCBwYXJhbXM6IFsxLDJdIH0sXG4gICAgICAgICAqICAgICAgICAgICAgICAgICAgeyBuYW1lOiAncmVzZXQnLCBwYXJhbXM6IFsyLDNdIH1dKTtcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJpbml0XCIgdGFrZXMgdHdvIGFyZ3VtZW50cyxcbiAgICAgICAgICogICAgICAvLyBtZXRob2QgXCJydW5tb2RlbFwiIHRha2VzIG5vbmVcbiAgICAgICAgICogICAgIHJzLnNlcmlhbChbICB7IG5hbWU6ICdpbml0JywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgIHsgbmFtZTogJ3J1bm1vZGVsJywgcGFyYW1zOiBbXSB9XSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSB7QXJyYXl9IG9wZXJhdGlvbnMgSWYgbm9uZSBvZiB0aGUgbWV0aG9kcyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2YgdGhlIG1ldGhvZCBuYW1lcyAoc3RyaW5ncykuIElmIGFueSBvZiB0aGUgbWV0aG9kcyBkbyB0YWtlIHBhcmFtZXRlcnMsIHBhc3MgYW4gYXJyYXkgb2Ygb2JqZWN0cywgZWFjaCBvZiB3aGljaCBjb250YWlucyBhIG1ldGhvZCBuYW1lIGFuZCBpdHMgb3duIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy5cbiAgICAgICAgICogQHBhcmFtIHsqfSBwYXJhbXMgUGFyYW1ldGVycyB0byBwYXNzIHRvIG9wZXJhdGlvbnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBzZXJpYWw6IGZ1bmN0aW9uIChvcGVyYXRpb25zLCBwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBvcFBhcmFtcyA9IHJ1dGlsLm5vcm1hbGl6ZU9wZXJhdGlvbnMob3BlcmF0aW9ucywgcGFyYW1zKTtcbiAgICAgICAgICAgIHZhciBvcHMgPSBvcFBhcmFtcy5vcHM7XG4gICAgICAgICAgICB2YXIgYXJncyA9IG9wUGFyYW1zLmFyZ3M7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YXIgJGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgICAgICB2YXIgcG9zdE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgcmVzcG9uc2VzID0gW107XG4gICAgICAgICAgICB2YXIgZG9TaW5nbGVPcCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3AgPSBvcHMuc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgYXJnID0gYXJncy5zaGlmdCgpO1xuXG4gICAgICAgICAgICAgICAgbWUuZG8ob3AsIGFyZywge1xuICAgICAgICAgICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNwb25zZXMucHVzaChyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wcy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb1NpbmdsZU9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUocmVzcG9uc2VzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5zdWNjZXNzKHJlc3BvbnNlcywgbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VzLnB1c2goZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkLnJlamVjdChyZXNwb25zZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuZXJyb3IocmVzcG9uc2VzLCBtZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGRvU2luZ2xlT3AoKTtcblxuICAgICAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbCBzZXZlcmFsIG1ldGhvZHMgZnJvbSB0aGUgbW9kZWwsIGV4ZWN1dGluZyB0aGVtIGluIHBhcmFsbGVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiBEZXBlbmRpbmcgb24gdGhlIGxhbmd1YWdlIGluIHdoaWNoIHlvdSBoYXZlIHdyaXR0ZW4geW91ciBtb2RlbCwgdGhlIG1ldGhvZHMgbWF5IG5lZWQgdG8gYmUgZXhwb3NlZCAoZS5nLiBgZXhwb3J0YCBmb3IgYSBKdWxpYSBtb2RlbCkgaW4gdGhlIG1vZGVsIGZpbGUgaW4gb3JkZXIgdG8gYmUgY2FsbGVkIHRocm91Z2ggdGhlIEFQSS4gU2VlIFtXcml0aW5nIHlvdXIgTW9kZWxdKC4uLy4uLy4uL3dyaXRpbmdfeW91cl9tb2RlbC8pKS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICAvLyBtZXRob2RzIFwic29sdmVcIiBhbmQgXCJyZXNldFwiIGRvIG5vdCB0YWtlIGFueSBhcmd1bWVudHNcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsnc29sdmUnLCAncmVzZXQnXSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKFsgeyBuYW1lOiAnYWRkJywgcGFyYW1zOiBbMSwyXSB9LFxuICAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IG5hbWU6ICdzdWJ0cmFjdCcsIHBhcmFtczpbMiwzXSB9XSk7XG4gICAgICAgICAqICAgICAgLy8gbWV0aG9kcyBcImFkZFwiIGFuZCBcInN1YnRyYWN0XCIgdGFrZSB0d28gYXJndW1lbnRzIGVhY2hcbiAgICAgICAgICogICAgIHJzLnBhcmFsbGVsKHsgYWRkOiBbMSwyXSwgc3VidHJhY3Q6IFsyLDRdIH0pO1xuICAgICAgICAgKlxuICAgICAgICAgKiAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAgKiBAcGFyYW0ge0FycmF5fE9iamVjdH0gb3BlcmF0aW9ucyBJZiBub25lIG9mIHRoZSBtZXRob2RzIHRha2UgcGFyYW1ldGVycywgcGFzcyBhbiBhcnJheSBvZiB0aGUgbWV0aG9kIG5hbWVzIChhcyBzdHJpbmdzKS4gSWYgYW55IG9mIHRoZSBtZXRob2RzIGRvIHRha2UgcGFyYW1ldGVycywgeW91IGhhdmUgdHdvIG9wdGlvbnMuIFlvdSBjYW4gcGFzcyBhbiBhcnJheSBvZiBvYmplY3RzLCBlYWNoIG9mIHdoaWNoIGNvbnRhaW5zIGEgbWV0aG9kIG5hbWUgYW5kIGl0cyBvd24gKHBvc3NpYmx5IGVtcHR5KSBhcnJheSBvZiBwYXJhbWV0ZXJzLiBBbHRlcm5hdGl2ZWx5LCB5b3UgY2FuIHBhc3MgYSBzaW5nbGUgb2JqZWN0IHdpdGggdGhlIG1ldGhvZCBuYW1lIGFuZCBhIChwb3NzaWJseSBlbXB0eSkgYXJyYXkgb2YgcGFyYW1ldGVycy5cbiAgICAgICAgICogQHBhcmFtIHsqfSBwYXJhbXMgUGFyYW1ldGVycyB0byBwYXNzIHRvIG9wZXJhdGlvbnMuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICBwYXJhbGxlbDogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyICRkID0gJC5EZWZlcnJlZCgpO1xuXG4gICAgICAgICAgICB2YXIgb3BQYXJhbXMgPSBydXRpbC5ub3JtYWxpemVPcGVyYXRpb25zKG9wZXJhdGlvbnMsIHBhcmFtcyk7XG4gICAgICAgICAgICB2YXIgb3BzID0gb3BQYXJhbXMub3BzO1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBvcFBhcmFtcy5hcmdzO1xuICAgICAgICAgICAgdmFyIHBvc3RPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHF1ZXVlID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG9wcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHF1ZXVlLnB1c2goXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZG8ob3BzW2ldLCBhcmdzW2ldKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgICAgICAkLndoZW4uYXBwbHkodGhpcywgcXVldWUpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3R1YWxSZXNwb25zZSA9IGFyZ3MubWFwKGZ1bmN0aW9uIChhKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYVswXTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICRkLnJlc29sdmUoYWN0dWFsUmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICBwb3N0T3B0aW9ucy5zdWNjZXNzKGFjdHVhbFJlc3BvbnNlLCBtZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGFjdHVhbFJlc3BvbnNlID0gYXJncy5tYXAoZnVuY3Rpb24gKGEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhWzBdO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJGQucmVqZWN0KGFjdHVhbFJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgcG9zdE9wdGlvbnMuZXJyb3IoYWN0dWFsUmVzcG9uc2UsIG1lKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuICRkLnByb21pc2UoKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogU2hvcnRjdXQgdG8gdXNpbmcgdGhlIFtJbnRyb3NwZWN0aW9uIEFQSSBTZXJ2aWNlXSguLi9pbnRyb3NwZWN0aW9uLWFwaS1zZXJ2aWNlLykuIEFsbG93cyB5b3UgdG8gdmlldyBhIGxpc3Qgb2YgdGhlIHZhcmlhYmxlcyBhbmQgb3BlcmF0aW9ucyBpbiBhIG1vZGVsLlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgcnMuaW50cm9zcGVjdCh7IHJ1bklEOiAnY2JmODU0MzctYjUzOS00OTc3LWExZmMtMjM1MTVjZjA3MWJiJyB9KS50aGVuKGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAqICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEuZnVuY3Rpb25zKTtcbiAgICAgICAgICogICAgICAgICAgY29uc29sZS5sb2coZGF0YS52YXJpYWJsZXMpO1xuICAgICAgICAgKiAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gb3B0aW9ucyBPcHRpb25zIGNhbiBlaXRoZXIgYmUgb2YgdGhlIGZvcm0gYHsgcnVuSUQ6IDxydW5pZD4gfWAgb3IgYHsgbW9kZWw6IDxtb2RlbEZpbGVOYW1lPiB9YC5cbiAgICAgICAgICogQHBhcmFtICB7T2JqZWN0fSBpbnRyb3NwZWN0aW9uQ29uZmlnIChPcHRpb25hbCkgU2VydmljZSBvcHRpb25zIGZvciBJbnRyb3NwZWN0aW9uIFNlcnZpY2VcbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgIGludHJvc3BlY3Q6IGZ1bmN0aW9uIChvcHRpb25zLCBpbnRyb3NwZWN0aW9uQ29uZmlnKSB7XG4gICAgICAgICAgICB2YXIgaW50cm9zcGVjdGlvbiA9IG5ldyBJbnRyb3NwZWN0aW9uU2VydmljZSgkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIGludHJvc3BlY3Rpb25Db25maWcpKTtcbiAgICAgICAgICAgIGlmIChvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMucnVuSUQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludHJvc3BlY3Rpb24uYnlSdW5JRChvcHRpb25zLnJ1bklEKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG9wdGlvbnMubW9kZWwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludHJvc3BlY3Rpb24uYnlNb2RlbChvcHRpb25zLm1vZGVsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGludHJvc3BlY3Rpb24uYnlSdW5JRChzZXJ2aWNlT3B0aW9ucy5pZCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignUGxlYXNlIHNwZWNpZnkgZWl0aGVyIHRoZSBtb2RlbCBvciBydW5pZCB0byBpbnRyb3NwZWN0Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY1N5bmNBUEkgPSB7XG4gICAgICAgIGdldEN1cnJlbnRDb25maWc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucztcbiAgICAgICAgfSxcbiAgICAgICAgdXBkYXRlQ29uZmlnOiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICBpZiAoY29uZmlnICYmIGNvbmZpZy5pZCkge1xuICAgICAgICAgICAgICAgIGNvbmZpZy5maWx0ZXIgPSBjb25maWcuaWQ7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGNvbmZpZyAmJiBjb25maWcuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgY29uZmlnLmlkID0gY29uZmlnLmZpbHRlcjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBjb25maWcpO1xuICAgICAgICB9LFxuICAgICAgICAvKipcbiAgICAgICAgICAqIFJldHVybnMgYSBWYXJpYWJsZXMgU2VydmljZSBpbnN0YW5jZS4gVXNlIHRoZSB2YXJpYWJsZXMgaW5zdGFuY2UgdG8gbG9hZCwgc2F2ZSwgYW5kIHF1ZXJ5IGZvciBzcGVjaWZpYyBtb2RlbCB2YXJpYWJsZXMuIFNlZSB0aGUgW1ZhcmlhYmxlIEFQSSBTZXJ2aWNlXSguLi92YXJpYWJsZXMtYXBpLXNlcnZpY2UvKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbiAgICAgICAgICAqXG4gICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgICpcbiAgICAgICAgICAqICAgICAgdmFyIHZzID0gcnMudmFyaWFibGVzKCk7XG4gICAgICAgICAgKiAgICAgIHZzLnNhdmUoeyBzYW1wbGVfaW50OiA0IH0pO1xuICAgICAgICAgICpcbiAgICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gY29uZmlnIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHZhcmlhYmxlc1NlcnZpY2UgSW5zdGFuY2VcbiAgICAgICAgICAqL1xuICAgICAgICB2YXJpYWJsZXM6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgIHZhciB2cyA9IG5ldyBWYXJpYWJsZXNTZXJ2aWNlKCQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgY29uZmlnLCB7XG4gICAgICAgICAgICAgICAgcnVuU2VydmljZTogdGhpc1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICAgICAgcmV0dXJuIHZzO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FzeW5jQVBJKTtcbiAgICAkLmV4dGVuZCh0aGlzLCBwdWJsaWNTeW5jQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIG9iamVjdEFzc2lnbiA9IHJlcXVpcmUoJ29iamVjdC1hc3NpZ24nKTtcblxudmFyIHNlcnZpY2VVdGlscyA9IHtcbiAgICAvKlxuICAgICogR2V0cyB0aGUgZGVmYXVsdCBvcHRpb25zIGZvciBhIGFwaSBzZXJ2aWNlLlxuICAgICogSXQgd2lsbCBtZXJnZTpcbiAgICAqIC0gVGhlIFNlc3Npb24gb3B0aW9ucyAoVXNpbmcgdGhlIFNlc3Npb24gTWFuYWdlcilcbiAgICAqIC0gVGhlIEF1dGhvcml6YXRpb24gSGVhZGVyIGZyb20gdGhlIHRva2VuIG9wdGlvblxuICAgICogLSBUaGUgZnVsbCB1cmwgZnJvbSB0aGUgZW5kcG9pbnQgb3B0aW9uXG4gICAgKiBXaXRoIHRoZSBzdXBwbGllZCBvdmVycmlkZXMgYW5kIGRlZmF1bHRzXG4gICAgKlxuICAgICovXG4gICAgZ2V0RGVmYXVsdE9wdGlvbnM6IGZ1bmN0aW9uIChkZWZhdWx0cykge1xuICAgICAgICB2YXIgcmVzdCA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIHZhciBzZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgICAgICB2YXIgc2VydmljZU9wdGlvbnMgPSBzZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zLmFwcGx5KHNlc3Npb25NYW5hZ2VyLCBbZGVmYXVsdHNdLmNvbmNhdChyZXN0KSk7XG5cbiAgICAgICAgc2VydmljZU9wdGlvbnMudHJhbnNwb3J0ID0gb2JqZWN0QXNzaWduKHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgICAgIHVybDogdGhpcy5nZXRBcGlVcmwoc2VydmljZU9wdGlvbnMuYXBpRW5kcG9pbnQsIHNlcnZpY2VPcHRpb25zKVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydC5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucztcbiAgICB9LFxuXG4gICAgZ2V0QXBpVXJsOiBmdW5jdGlvbiAoYXBpRW5kcG9pbnQsIHNlcnZpY2VPcHRpb25zKSB7XG4gICAgICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICAgICAgcmV0dXJuIHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHNlcnZpY2VVdGlsczsiLCIndXNlIHN0cmljdCc7XG4vKipcbiAqICMjIFN0YXRlIEFQSSBBZGFwdGVyXG4gKlxuICogVGhlIFN0YXRlIEFQSSBBZGFwdGVyIGFsbG93cyB5b3UgdG8gcmVwbGF5IG9yIGNsb25lIHJ1bnMuIEl0IGJyaW5ncyBleGlzdGluZywgcGVyc2lzdGVkIHJ1biBkYXRhIGZyb20gdGhlIGRhdGFiYXNlIGJhY2sgaW50byBtZW1vcnksIHVzaW5nIHRoZSBzYW1lIHJ1biBpZCAoYHJlcGxheWApIG9yIGEgbmV3IHJ1biBpZCAoYGNsb25lYCkuIFJ1bnMgbXVzdCBiZSBpbiBtZW1vcnkgaW4gb3JkZXIgZm9yIHlvdSB0byB1cGRhdGUgdmFyaWFibGVzIG9yIGNhbGwgb3BlcmF0aW9ucyBvbiB0aGVtLlxuICpcbiAqIFNwZWNpZmljYWxseSwgdGhlIFN0YXRlIEFQSSBBZGFwdGVyIHdvcmtzIGJ5IFwicmUtcnVubmluZ1wiIHRoZSBydW4gKHVzZXIgaW50ZXJhY3Rpb25zKSBmcm9tIHRoZSBjcmVhdGlvbiBvZiB0aGUgcnVuIHVwIHRvIHRoZSB0aW1lIGl0IHdhcyBsYXN0IHBlcnNpc3RlZCBpbiB0aGUgZGF0YWJhc2UuIFRoaXMgcHJvY2VzcyB1c2VzIHRoZSBjdXJyZW50IHZlcnNpb24gb2YgdGhlIHJ1bidzIG1vZGVsLiBUaGVyZWZvcmUsIGlmIHRoZSBtb2RlbCBoYXMgY2hhbmdlZCBzaW5jZSB0aGUgb3JpZ2luYWwgcnVuIHdhcyBjcmVhdGVkLCB0aGUgcmV0cmlldmVkIHJ1biB3aWxsIHVzZSB0aGUgbmV3IG1vZGVsIOKAlCBhbmQgbWF5IGVuZCB1cCBoYXZpbmcgZGlmZmVyZW50IHZhbHVlcyBvciBiZWhhdmlvciBhcyBhIHJlc3VsdC4gVXNlIHdpdGggY2FyZSFcbiAqXG4gKiBUbyB1c2UgdGhlIFN0YXRlIEFQSSBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBjYWxsIGl0cyBtZXRob2RzOlxuICpcbiAqICAgICAgdmFyIHNhID0gbmV3IEYuc2VydmljZS5TdGF0ZSgpO1xuICogICAgICBzYS5yZXBsYXkoe3J1bklkOiAnMTg0MmJiNWMtODNhZC00YmE4LWE5NTUtYmQxM2NjMmZkYjRmJ30pO1xuICpcbiAqIFRoZSBjb25zdHJ1Y3RvciB0YWtlcyBhbiBvcHRpb25hbCBgb3B0aW9uc2AgcGFyYW1ldGVyIGluIHdoaWNoIHlvdSBjYW4gc3BlY2lmeSB0aGUgYGFjY291bnRgIGFuZCBgcHJvamVjdGAgaWYgdGhleSBhcmUgbm90IGFscmVhZHkgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50IGNvbnRleHQuXG4gKlxuICovXG5cbnZhciBDb25maWdTZXJ2aWNlID0gcmVxdWlyZSgnLi9jb25maWd1cmF0aW9uLXNlcnZpY2UnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBfcGljayA9IHJlcXVpcmUoJy4uL3V0aWwvb2JqZWN0LXV0aWwnKS5fcGljaztcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIGFwaUVuZHBvaW50ID0gJ21vZGVsL3N0YXRlJztcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG5cbiAgICB2YXIgZGVmYXVsdHMgPSB7XG5cbiAgICB9O1xuXG4gICAgdGhpcy5zZXNzaW9uTWFuYWdlciA9IG5ldyBTZXNzaW9uTWFuYWdlcigpO1xuICAgIHZhciBzZXJ2aWNlT3B0aW9ucyA9IHRoaXMuc2Vzc2lvbk1hbmFnZXIuZ2V0TWVyZ2VkT3B0aW9ucyhkZWZhdWx0cywgY29uZmlnKTtcbiAgICB2YXIgdXJsQ29uZmlnID0gbmV3IENvbmZpZ1NlcnZpY2Uoc2VydmljZU9wdGlvbnMpLmdldCgnc2VydmVyJyk7XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludClcbiAgICB9KTtcblxuICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICB0cmFuc3BvcnRPcHRpb25zLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciBodHRwID0gbmV3IFRyYW5zcG9ydEZhY3RvcnkodHJhbnNwb3J0T3B0aW9ucyk7XG4gICAgdmFyIHBhcnNlUnVuSWRPckVycm9yID0gZnVuY3Rpb24gKHBhcmFtcykge1xuICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHBhcmFtcykgJiYgcGFyYW1zLnJ1bklkKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyYW1zLnJ1bklkO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcGFzcyBpbiBhIHJ1biBpZCcpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChydW5JZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGh0dHBQYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JZCB9XG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KCcnLCBodHRwUGFyYW1zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXBsYXkgYSBydW4uIEFmdGVyIHRoaXMgY2FsbCwgdGhlIHJ1biwgd2l0aCBpdHMgb3JpZ2luYWwgcnVuIGlkLCBpcyBub3cgYXZhaWxhYmxlIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiAoSXQgY29udGludWVzIHRvIGJlIHBlcnNpc3RlZCBpbnRvIHRoZSBFcGljZW50ZXIgZGF0YWJhc2UgYXQgcmVndWxhciBpbnRlcnZhbHMuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciBzYSA9IG5ldyBGLnNlcnZpY2UuU3RhdGUoKTtcbiAgICAgICAgKiAgICAgIHNhLnJlcGxheSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnLCBzdG9wQmVmb3JlOiAnY2FsY3VsYXRlU2NvcmUnfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgb2JqZWN0LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMucnVuSWQgVGhlIGlkIG9mIHRoZSBydW4gdG8gYnJpbmcgYmFjayB0byBtZW1vcnkuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHBhcmFtcy5zdG9wQmVmb3JlIChPcHRpb25hbCkgVGhlIHJ1biBpcyBhZHZhbmNlZCBvbmx5IHVwIHRvIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIHRoaXMgbWV0aG9kLlxuICAgICAgICAqIEBwYXJhbSB7YXJyYXl9IHBhcmFtcy5leGNsdWRlIChPcHRpb25hbCkgQXJyYXkgb2YgbWV0aG9kcyB0byBleGNsdWRlIHdoZW4gYWR2YW5jaW5nIHRoZSBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICByZXBsYXk6IGZ1bmN0aW9uIChwYXJhbXMsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBydW5JZCA9IHBhcnNlUnVuSWRPckVycm9yKHBhcmFtcyk7XG5cbiAgICAgICAgICAgIHZhciByZXBsYXlPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgcnVuSWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gJC5leHRlbmQodHJ1ZSwgeyBhY3Rpb246ICdyZXBsYXknIH0sIF9waWNrKHBhcmFtcywgWydzdG9wQmVmb3JlJywgJ2V4Y2x1ZGUnXSkpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHBhcmFtcywgcmVwbGF5T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQ2xvbmUgYSBnaXZlbiBydW4gYW5kIHJldHVybiBhIG5ldyBydW4gaW4gdGhlIHNhbWUgc3RhdGUgYXMgdGhlIGdpdmVuIHJ1bi5cbiAgICAgICAgKlxuICAgICAgICAqIFRoZSBuZXcgcnVuIGlkIGlzIG5vdyBhdmFpbGFibGUgW2luIG1lbW9yeV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLW1lbW9yeSkuIFRoZSBuZXcgcnVuIGluY2x1ZGVzIGEgY29weSBvZiBhbGwgb2YgdGhlIGRhdGEgZnJvbSB0aGUgb3JpZ2luYWwgcnVuLCBFWENFUFQ6XG4gICAgICAgICpcbiAgICAgICAgKiAqIFRoZSBgc2F2ZWRgIGZpZWxkIGluIHRoZSBuZXcgcnVuIHJlY29yZCBpcyBub3QgY29waWVkIGZyb20gdGhlIG9yaWdpbmFsIHJ1biByZWNvcmQuIEl0IGRlZmF1bHRzIHRvIGBmYWxzZWAuXG4gICAgICAgICogKiBUaGUgYGluaXRpYWxpemVkYCBmaWVsZCBpbiB0aGUgbmV3IHJ1biByZWNvcmQgaXMgbm90IGNvcGllZCBmcm9tIHRoZSBvcmlnaW5hbCBydW4gcmVjb3JkLiBJdCBkZWZhdWx0cyB0byBgZmFsc2VgIGJ1dCBtYXkgY2hhbmdlIHRvIGB0cnVlYCBhcyB0aGUgbmV3IHJ1biBpcyBhZHZhbmNlZC4gRm9yIGV4YW1wbGUsIGlmIHRoZXJlIGhhcyBiZWVuIGEgY2FsbCB0byB0aGUgYHN0ZXBgIGZ1bmN0aW9uIChmb3IgVmVuc2ltIG1vZGVscyksIHRoZSBgaW5pdGlhbGl6ZWRgIGZpZWxkIGlzIHNldCB0byBgdHJ1ZWAuXG4gICAgICAgICogKiBUaGUgYGNyZWF0ZWRgIGZpZWxkIGluIHRoZSBuZXcgcnVuIHJlY29yZCBpcyB0aGUgZGF0ZSBhbmQgdGltZSBhdCB3aGljaCB0aGUgY2xvbmUgd2FzIGNyZWF0ZWQgKG5vdCB0aGUgdGltZSB0aGF0IHRoZSBvcmlnaW5hbCBydW4gd2FzIGNyZWF0ZWQuKVxuICAgICAgICAqXG4gICAgICAgICogVGhlIG9yaWdpbmFsIHJ1biByZW1haW5zIG9ubHkgW2luIHRoZSBkYXRhYmFzZV0oLi4vLi4vLi4vcnVuX3BlcnNpc3RlbmNlLyNydW5zLWluLWRiKS5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgc2EgPSBuZXcgRi5zZXJ2aWNlLlN0YXRlKCk7XG4gICAgICAgICogICAgICBzYS5jbG9uZSh7cnVuSWQ6ICcxODQyYmI1Yy04M2FkLTRiYTgtYTk1NS1iZDEzY2MyZmRiNGYnLCBzdG9wQmVmb3JlOiAnY2FsY3VsYXRlU2NvcmUnLCBleGNsdWRlOiBbJ2ludGVyaW1DYWxjdWxhdGlvbiddIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcyBQYXJhbWV0ZXJzIG9iamVjdC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLnJ1bklkIFRoZSBpZCBvZiB0aGUgcnVuIHRvIGNsb25lIGZyb20gbWVtb3J5LlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMuc3RvcEJlZm9yZSAoT3B0aW9uYWwpIFRoZSBuZXdseSBjbG9uZWQgcnVuIGlzIGFkdmFuY2VkIG9ubHkgdXAgdG8gdGhlIGZpcnN0IG9jY3VycmVuY2Ugb2YgdGhpcyBtZXRob2QuXG4gICAgICAgICogQHBhcmFtIHthcnJheX0gcGFyYW1zLmV4Y2x1ZGUgKE9wdGlvbmFsKSBBcnJheSBvZiBtZXRob2RzIHRvIGV4Y2x1ZGUgd2hlbiBhZHZhbmNpbmcgdGhlIG5ld2x5IGNsb25lZCBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBjbG9uZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJ1bklkID0gcGFyc2VSdW5JZE9yRXJyb3IocGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIHJlcGxheU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBydW5JZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICBwYXJhbXMgPSAkLmV4dGVuZCh0cnVlLCB7IGFjdGlvbjogJ2Nsb25lJyB9LCBfcGljayhwYXJhbXMsIFsnc3RvcEJlZm9yZScsICdleGNsdWRlJ10pKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAucG9zdChwYXJhbXMsIHJlcGxheU9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZXBpVmVyc2lvbiA9IHJlcXVpcmUoJy4uL2FwaS12ZXJzaW9uLmpzb24nKTtcblxuLy9UT0RPOiB1cmx1dGlscyB0byBnZXQgaG9zdCwgc2luY2Ugbm8gd2luZG93IG9uIG5vZGVcbnZhciBkZWZhdWx0cyA9IHtcbiAgICBob3N0OiB3aW5kb3cubG9jYXRpb24uaG9zdCxcbiAgICBwYXRobmFtZTogd2luZG93LmxvY2F0aW9uLnBhdGhuYW1lXG59O1xuXG5mdW5jdGlvbiBnZXRMb2NhbEhvc3QoZXhpc3RpbmdGbiwgaG9zdCkge1xuICAgIHZhciBsb2NhbEhvc3RGbjtcbiAgICBpZiAoZXhpc3RpbmdGbiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGlmICghJC5pc0Z1bmN0aW9uKGV4aXN0aW5nRm4pKSB7XG4gICAgICAgICAgICBsb2NhbEhvc3RGbiA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuIGV4aXN0aW5nRm47IH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBsb2NhbEhvc3RGbiA9IGV4aXN0aW5nRm47XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBsb2NhbEhvc3RGbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBpc0xvY2FsID0gIWhvc3QgfHwgLy9waGFudG9tanNcbiAgICAgICAgICAgICAgICBob3N0ID09PSAnMTI3LjAuMC4xJyB8fCBcbiAgICAgICAgICAgICAgICBob3N0LmluZGV4T2YoJ2xvY2FsLicpID09PSAwIHx8IFxuICAgICAgICAgICAgICAgIGhvc3QuaW5kZXhPZignbG9jYWxob3N0JykgPT09IDA7XG4gICAgICAgICAgICByZXR1cm4gaXNMb2NhbDtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIGxvY2FsSG9zdEZuO1xufVxuXG52YXIgVXJsQ29uZmlnU2VydmljZSA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZW52Q29uZiA9IFVybENvbmZpZ1NlcnZpY2UuZGVmYXVsdHM7XG5cbiAgICBpZiAoIWNvbmZpZykge1xuICAgICAgICBjb25maWcgPSB7fTtcbiAgICB9XG4gICAgLy8gY29uc29sZS5sb2codGhpcy5kZWZhdWx0cyk7XG4gICAgdmFyIG92ZXJyaWRlcyA9ICQuZXh0ZW5kKHt9LCBlbnZDb25mLCBjb25maWcpO1xuICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoe30sIGRlZmF1bHRzLCBvdmVycmlkZXMpO1xuXG4gICAgb3ZlcnJpZGVzLmlzTG9jYWxob3N0ID0gb3B0aW9ucy5pc0xvY2FsaG9zdCA9IGdldExvY2FsSG9zdChvcHRpb25zLmlzTG9jYWxob3N0LCBvcHRpb25zLmhvc3QpO1xuICAgIFxuICAgIC8vIGNvbnNvbGUubG9nKGlzTG9jYWxob3N0KCksICdfX19fX19fX19fXycpO1xuICAgIHZhciBhY3RpbmdIb3N0ID0gY29uZmlnICYmIGNvbmZpZy5ob3N0O1xuICAgIGlmICghYWN0aW5nSG9zdCAmJiBvcHRpb25zLmlzTG9jYWxob3N0KCkpIHtcbiAgICAgICAgYWN0aW5nSG9zdCA9ICdmb3Jpby5jb20nO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIGFjdGluZ0hvc3QgPSBvcHRpb25zLmhvc3Q7XG4gICAgfVxuXG4gICAgdmFyIEFQSV9QUk9UT0NPTCA9ICdodHRwcyc7XG4gICAgdmFyIEhPU1RfQVBJX01BUFBJTkcgPSB7XG4gICAgICAgICdmb3Jpby5jb20nOiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgICdmb3Jpb2Rldi5jb20nOiAnYXBpLmVwaWNlbnRlci5mb3Jpb2Rldi5jb20nXG4gICAgfTtcblxuICAgIHZhciBwdWJsaWNFeHBvcnRzID0ge1xuICAgICAgICBwcm90b2NvbDogQVBJX1BST1RPQ09MLFxuXG4gICAgICAgIGFwaTogJycsXG5cbiAgICAgICAgLy9UT0RPOiB0aGlzIHNob3VsZCByZWFsbHkgYmUgY2FsbGVkICdhcGlob3N0JywgYnV0IGNhbid0IGJlY2F1c2UgdGhhdCB3b3VsZCBicmVhayB0b28gbWFueSB0aGluZ3NcbiAgICAgICAgaG9zdDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhcGlIb3N0ID0gKEhPU1RfQVBJX01BUFBJTkdbYWN0aW5nSG9zdF0pID8gSE9TVF9BUElfTUFQUElOR1thY3RpbmdIb3N0XSA6IGFjdGluZ0hvc3Q7XG4gICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhhY3RpbmdIb3N0LCBjb25maWcsIGFwaUhvc3QpO1xuICAgICAgICAgICAgcmV0dXJuIGFwaUhvc3Q7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgaXNDdXN0b21Eb21haW46IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcGF0aCA9IG9wdGlvbnMucGF0aG5hbWUuc3BsaXQoJ1xcLycpO1xuICAgICAgICAgICAgdmFyIHBhdGhIYXNBcHAgPSBwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnO1xuICAgICAgICAgICAgcmV0dXJuICghb3B0aW9ucy5pc0xvY2FsaG9zdCgpICYmICFwYXRoSGFzQXBwKTtcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBhcHBQYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHBhdGggPSBvcHRpb25zLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcblxuICAgICAgICAgICAgcmV0dXJuIHBhdGggJiYgcGF0aFsxXSB8fCAnJztcbiAgICAgICAgfSgpKSxcblxuICAgICAgICBhY2NvdW50UGF0aDogKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBhY2NudCA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBvcHRpb25zLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcbiAgICAgICAgICAgIGlmIChwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnKSB7XG4gICAgICAgICAgICAgICAgYWNjbnQgPSBwYXRoWzJdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGFjY250O1xuICAgICAgICB9KCkpLFxuXG4gICAgICAgIHByb2plY3RQYXRoOiAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHByaiA9ICcnO1xuICAgICAgICAgICAgdmFyIHBhdGggPSBvcHRpb25zLnBhdGhuYW1lLnNwbGl0KCdcXC8nKTtcbiAgICAgICAgICAgIGlmIChwYXRoICYmIHBhdGhbMV0gPT09ICdhcHAnKSB7XG4gICAgICAgICAgICAgICAgcHJqID0gcGF0aFszXTsgLy9lc2xpbnQtZGlzYWJsZS1saW5lIG5vLW1hZ2ljLW51bWJlcnNcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBwcmo7XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgdmVyc2lvblBhdGg6IChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdmVyc2lvbiA9IGVwaVZlcnNpb24udmVyc2lvbiA/IGVwaVZlcnNpb24udmVyc2lvbiArICcvJyA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgICAgIH0oKSksXG5cbiAgICAgICAgZ2V0QVBJUGF0aDogZnVuY3Rpb24gKGFwaSkge1xuICAgICAgICAgICAgdmFyIFBST0pFQ1RfQVBJUyA9IFsncnVuJywgJ2RhdGEnLCAnZmlsZSddO1xuXG4gICAgICAgICAgICBpZiAoYXBpID09PSAnY29uZmlnJykge1xuICAgICAgICAgICAgICAgIC8vIHZhciBiYXNlID0gb3B0aW9ucy5pc0xvY2FsaG9zdCgpID8gJycgOiBcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5wcm90b2NvbCArICc6Ly8nICsgYWN0aW5nSG9zdCArICcvZXBpY2VudGVyL3YxL2NvbmZpZyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYXBpUGF0aCA9IHRoaXMucHJvdG9jb2wgKyAnOi8vJyArIHRoaXMuaG9zdCArICcvJyArIHRoaXMudmVyc2lvblBhdGggKyBhcGkgKyAnLyc7XG5cbiAgICAgICAgICAgIGlmICgkLmluQXJyYXkoYXBpLCBQUk9KRUNUX0FQSVMpICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGFwaVBhdGggKz0gdGhpcy5hY2NvdW50UGF0aCArICcvJyArIHRoaXMucHJvamVjdFBhdGggKyAnLyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYXBpUGF0aDtcbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgICQuZXh0ZW5kKHB1YmxpY0V4cG9ydHMsIG92ZXJyaWRlcyk7XG4gICAgcmV0dXJuIHB1YmxpY0V4cG9ydHM7XG59O1xuLy8gVGhpcyBkYXRhIGNhbiBiZSBzZXQgYnkgZXh0ZXJuYWwgc2NyaXB0cywgZm9yIGxvYWRpbmcgZnJvbSBhbiBlbnYgc2VydmVyIGZvciBlZztcblVybENvbmZpZ1NlcnZpY2UuZGVmYXVsdHMgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSBVcmxDb25maWdTZXJ2aWNlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuLyoqXG4qICMjIFVzZXIgQVBJIEFkYXB0ZXJcbipcbiogVGhlIFVzZXIgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byByZXRyaWV2ZSBkZXRhaWxzIGFib3V0IGVuZCB1c2VycyBpbiB5b3VyIHRlYW0gKGFjY291bnQpLiBJdCBpcyBiYXNlZCBvbiB0aGUgcXVlcnlpbmcgY2FwYWJpbGl0aWVzIG9mIHRoZSB1bmRlcmx5aW5nIFJFU1RmdWwgW1VzZXIgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvdXNlcl9tYW5hZ2VtZW50L3VzZXIvKS5cbipcbiogVG8gdXNlIHRoZSBVc2VyIEFQSSBBZGFwdGVyLCBpbnN0YW50aWF0ZSBpdCBhbmQgdGhlbiBjYWxsIGl0cyBtZXRob2RzLlxuKlxuKiAgICAgICB2YXIgdWEgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoe1xuKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuKiAgICAgICB9KTtcbiogICAgICAgdWEuZ2V0QnlJZCgnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyk7XG4qICAgICAgIHVhLmdldCh7IHVzZXJOYW1lOiAnanNtaXRoJyB9KTtcbiogICAgICAgdWEuZ2V0KHsgaWQ6IFsnNDI4MzZkNGItNWI2MS00ZmU0LTgwZWItMzEzNmU5NTZlZTVjJyxcbiogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuKlxuKiBUaGUgY29uc3RydWN0b3IgdGFrZXMgYW4gb3B0aW9uYWwgb3B0aW9ucyBwYXJhbWV0ZXIgaW4gd2hpY2ggeW91IGNhbiBzcGVjaWZ5IHRoZSBgYWNjb3VudGAgYW5kIGB0b2tlbmAgaWYgdGhleSBhcmUgbm90IGFscmVhZHkgYXZhaWxhYmxlIGluIHRoZSBjdXJyZW50IGNvbnRleHQuXG4qL1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG52YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG52YXIgU2Vzc2lvbk1hbmFnZXIgPSByZXF1aXJlKCcuLi9zdG9yZS9zZXNzaW9uLW1hbmFnZXInKTtcbnZhciBxdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwvcXVlcnktdXRpbCcpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgZGVmYXVsdHMgPSB7XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2NvdW50IGlkLiBJbiB0aGUgRXBpY2VudGVyIFVJLCB0aGlzIGlzIHRoZSAqKlRlYW0gSUQqKiAoZm9yIHRlYW0gcHJvamVjdHMpIG9yICoqVXNlciBJRCoqIChmb3IgcGVyc29uYWwgcHJvamVjdHMpLiBEZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBhY2NvdW50OiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBhY2Nlc3MgdG9rZW4gdG8gdXNlIHdoZW4gc2VhcmNoaW5nIGZvciBlbmQgdXNlcnMuIChTZWUgW21vcmUgYmFja2dyb3VuZCBvbiBhY2Nlc3MgdG9rZW5zXSguLi8uLi8uLi9wcm9qZWN0X2FjY2Vzcy8pKS5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fVxuICAgIH07XG5cbiAgICB0aGlzLnNlc3Npb25NYW5hZ2VyID0gbmV3IFNlc3Npb25NYW5hZ2VyKCk7XG4gICAgdmFyIHNlcnZpY2VPcHRpb25zID0gdGhpcy5zZXNzaW9uTWFuYWdlci5nZXRNZXJnZWRPcHRpb25zKGRlZmF1bHRzLCBjb25maWcpO1xuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucy50cmFuc3BvcnQsIHtcbiAgICAgICAgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aCgndXNlcicpXG4gICAgfSk7XG5cbiAgICBpZiAoc2VydmljZU9wdGlvbnMudG9rZW4pIHtcbiAgICAgICAgdHJhbnNwb3J0T3B0aW9ucy5oZWFkZXJzID0ge1xuICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgc2VydmljZU9wdGlvbnMudG9rZW5cbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KHRyYW5zcG9ydE9wdGlvbnMpO1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgKiBSZXRyaWV2ZSBkZXRhaWxzIGFib3V0IHBhcnRpY3VsYXIgZW5kIHVzZXJzIGluIHlvdXIgdGVhbSwgYmFzZWQgb24gdXNlciBuYW1lIG9yIHVzZXIgaWQuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICAgdmFyIHVhID0gbmV3IEYuc2VydmljZS5Vc2VyKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICB0b2tlbjogJ3VzZXItb3ItcHJvamVjdC1hY2Nlc3MtdG9rZW4nXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICogICAgICAgdWEuZ2V0KHsgdXNlck5hbWU6ICdqc21pdGgnIH0pO1xuICAgICAgICAqICAgICAgIHVhLmdldCh7IGlkOiBbJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgJzRlYTc1NjMxLTRjOGQtNDg3Mi05ZDgwLWI0NjAwMTQ2NDc4ZSddIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gZmlsdGVyIE9iamVjdCB3aXRoIGZpZWxkIGB1c2VyTmFtZWAgYW5kIHZhbHVlIG9mIHRoZSB1c2VybmFtZS4gQWx0ZXJuYXRpdmVseSwgb2JqZWN0IHdpdGggZmllbGQgYGlkYCBhbmQgdmFsdWUgb2YgYW4gYXJyYXkgb2YgdXNlciBpZHMuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuXG4gICAgICAgIGdldDogZnVuY3Rpb24gKGZpbHRlciwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBmaWx0ZXIgPSBmaWx0ZXIgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9uc1xuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdmFyIHRvUUZpbHRlciA9IGZ1bmN0aW9uIChmaWx0ZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0ge307XG5cbiAgICAgICAgICAgICAgICAvLyBBUEkgb25seSBzdXBwb3J0cyBmaWx0ZXJpbmcgYnkgdXNlcm5hbWUgZm9yIG5vd1xuICAgICAgICAgICAgICAgIGlmIChmaWx0ZXIudXNlck5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnEgPSBmaWx0ZXIudXNlck5hbWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciB0b0lkRmlsdGVycyA9IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgICAgIGlmICghaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlkID0gJC5pc0FycmF5KGlkKSA/IGlkIDogW2lkXTtcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2lkPScgKyBpZC5qb2luKCcmaWQ9Jyk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgZ2V0RmlsdGVycyA9IFtcbiAgICAgICAgICAgICAgICAnYWNjb3VudD0nICsgZ2V0T3B0aW9ucy5hY2NvdW50LFxuICAgICAgICAgICAgICAgIHRvSWRGaWx0ZXJzKGZpbHRlci5pZCksXG4gICAgICAgICAgICAgICAgcXV0aWwudG9RdWVyeUZvcm1hdCh0b1FGaWx0ZXIoZmlsdGVyKSlcbiAgICAgICAgICAgIF0uam9pbignJicpO1xuXG4gICAgICAgICAgICAvLyBzcGVjaWFsIGNhc2UgZm9yIHF1ZXJpZXMgd2l0aCBsYXJnZSBudW1iZXIgb2YgaWRzXG4gICAgICAgICAgICAvLyBtYWtlIGl0IGFzIGEgcG9zdCB3aXRoIEdFVCBzZW1hbnRpY3NcbiAgICAgICAgICAgIHZhciB0aHJlc2hvbGQgPSAzMDtcbiAgICAgICAgICAgIGlmIChmaWx0ZXIuaWQgJiYgJC5pc0FycmF5KGZpbHRlci5pZCkgJiYgZmlsdGVyLmlkLmxlbmd0aCA+PSB0aHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBnZXRPcHRpb25zLnVybCA9IHVybENvbmZpZy5nZXRBUElQYXRoKCd1c2VyJykgKyAnP19tZXRob2Q9R0VUJztcbiAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KHsgaWQ6IGZpbHRlci5pZCB9LCBnZXRPcHRpb25zKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KGdldEZpbHRlcnMsIGdldE9wdGlvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJldHJpZXZlIGRldGFpbHMgYWJvdXQgYSBzaW5nbGUgZW5kIHVzZXIgaW4geW91ciB0ZWFtLCBiYXNlZCBvbiB1c2VyIGlkLlxuICAgICAgICAqXG4gICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgIHZhciB1YSA9IG5ldyBGLnNlcnZpY2UuVXNlcih7XG4gICAgICAgICogICAgICAgICAgIGFjY291bnQ6ICdhY21lLXNpbXVsYXRpb25zJyxcbiAgICAgICAgKiAgICAgICAgICAgdG9rZW46ICd1c2VyLW9yLXByb2plY3QtYWNjZXNzLXRva2VuJ1xuICAgICAgICAqICAgICAgIH0pO1xuICAgICAgICAqICAgICAgIHVhLmdldEJ5SWQoJzQyODM2ZDRiLTViNjEtNGZlNC04MGViLTMxMzZlOTU2ZWU1YycpO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gdXNlcklkIFRoZSB1c2VyIGlkIGZvciB0aGUgZW5kIHVzZXIgaW4geW91ciB0ZWFtLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cblxuICAgICAgICBnZXRCeUlkOiBmdW5jdGlvbiAodXNlcklkLCBvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gcHVibGljQVBJLmdldCh7IGlkOiB1c2VySWQgfSwgb3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG5cblxuIiwiLyoqXG4gKlxuICogIyMgVmFyaWFibGVzIEFQSSBTZXJ2aWNlXG4gKlxuICogVXNlZCBpbiBjb25qdW5jdGlvbiB3aXRoIHRoZSBbUnVuIEFQSSBTZXJ2aWNlXSguLi9ydW4tYXBpLXNlcnZpY2UvKSB0byByZWFkLCB3cml0ZSwgYW5kIHNlYXJjaCBmb3Igc3BlY2lmaWMgbW9kZWwgdmFyaWFibGVzLlxuICpcbiAqICAgICB2YXIgcm0gPSBuZXcgRi5tYW5hZ2VyLlJ1bk1hbmFnZXIoe1xuICogICAgICAgICAgIHJ1bjoge1xuICogICAgICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gKiAgICAgICAgICAgICAgIG1vZGVsOiAnc3VwcGx5LWNoYWluLW1vZGVsLmpsJ1xuICogICAgICAgICAgIH1cbiAqICAgICAgfSk7XG4gKiAgICAgcm0uZ2V0UnVuKClcbiAqICAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xuICogICAgICAgICAgdmFyIHZzID0gcm0ucnVuLnZhcmlhYmxlcygpO1xuICogICAgICAgICAgdnMuc2F2ZSh7c2FtcGxlX2ludDogNH0pO1xuICogICAgICAgIH0pO1xuICpcbiAqL1xuXG5cbiAndXNlIHN0cmljdCc7XG5cbiB2YXIgVHJhbnNwb3J0RmFjdG9yeSA9IHJlcXVpcmUoJy4uL3RyYW5zcG9ydC9odHRwLXRyYW5zcG9ydC1mYWN0b3J5Jyk7XG4gdmFyIHJ1dGlsID0gcmVxdWlyZSgnLi4vdXRpbC9ydW4tdXRpbCcpO1xuXG4gbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBydW5zIG9iamVjdCB0byB3aGljaCB0aGUgdmFyaWFibGUgZmlsdGVycyBhcHBseS4gRGVmYXVsdHMgdG8gbnVsbC5cbiAgICAgICAgICogQHR5cGUge3J1blNlcnZpY2V9XG4gICAgICAgICAqL1xuICAgICAgICAgcnVuU2VydmljZTogbnVsbFxuICAgICB9O1xuICAgICB2YXIgc2VydmljZU9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgZGVmYXVsdHMsIGNvbmZpZyk7XG5cbiAgICAgdmFyIGdldFVSTCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgIHJldHVybiBzZXJ2aWNlT3B0aW9ucy5ydW5TZXJ2aWNlLnVybENvbmZpZy5nZXRGaWx0ZXJVUkwoKSArICd2YXJpYWJsZXMvJztcbiAgICAgfTtcblxuICAgICB2YXIgYWRkQXV0b1Jlc3RvcmVIZWFkZXIgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICAgcmV0dXJuIHNlcnZpY2VPcHRpb25zLnJ1blNlcnZpY2UudXJsQ29uZmlnLmFkZEF1dG9SZXN0b3JlSGVhZGVyKG9wdGlvbnMpO1xuICAgICB9O1xuXG4gICAgIHZhciBodHRwT3B0aW9ucyA9IHtcbiAgICAgICAgIHVybDogZ2V0VVJMXG4gICAgIH07XG4gICAgIGlmIChzZXJ2aWNlT3B0aW9ucy50b2tlbikge1xuICAgICAgICAgaHR0cE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBzZXJ2aWNlT3B0aW9ucy50b2tlblxuICAgICAgICAgfTtcbiAgICAgfVxuICAgICB2YXIgaHR0cCA9IG5ldyBUcmFuc3BvcnRGYWN0b3J5KGh0dHBPcHRpb25zKTtcbiAgICAgaHR0cC5zcGxpdEdldCA9IHJ1dGlsLnNwbGl0R2V0RmFjdG9yeShodHRwT3B0aW9ucyk7XG5cbiAgICAgdmFyIHB1YmxpY0FQSSA9IHtcblxuICAgICAgICAvKipcbiAgICAgICAgICogR2V0IHZhbHVlcyBmb3IgYSB2YXJpYWJsZS5cbiAgICAgICAgICpcbiAgICAgICAgICogKipFeGFtcGxlKipcbiAgICAgICAgICpcbiAgICAgICAgICogICAgICB2cy5sb2FkKCdzYW1wbGVfaW50JylcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24odmFsKXtcbiAgICAgICAgICogICAgICAgICAgICAgIC8vIHZhbCBjb250YWlucyB0aGUgdmFsdWUgb2Ygc2FtcGxlX2ludFxuICAgICAgICAgKiAgICAgICAgICB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHZhcmlhYmxlIE5hbWUgb2YgdmFyaWFibGUgdG8gbG9hZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICAgbG9hZDogZnVuY3Rpb24gKHZhcmlhYmxlLCBvdXRwdXRNb2RpZmllciwgb3B0aW9ucykge1xuICAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgICAgICAgaHR0cE9wdGlvbnMgPSBhZGRBdXRvUmVzdG9yZUhlYWRlcihodHRwT3B0aW9ucyk7XG4gICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KG91dHB1dE1vZGlmaWVyLCAkLmV4dGVuZCh7fSwgaHR0cE9wdGlvbnMsIHtcbiAgICAgICAgICAgICAgICAgdXJsOiBnZXRVUkwoKSArIHZhcmlhYmxlICsgJy8nXG4gICAgICAgICAgICAgfSkpO1xuICAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmV0dXJucyBwYXJ0aWN1bGFyIHZhcmlhYmxlcywgYmFzZWQgb24gY29uZGl0aW9ucyBzcGVjaWZpZWQgaW4gdGhlIGBxdWVyeWAgb2JqZWN0LlxuICAgICAgICAgKlxuICAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAgKlxuICAgICAgICAgKiAgICAgIHZzLnF1ZXJ5KFsncHJpY2UnLCAnc2FsZXMnXSlcbiAgICAgICAgICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24odmFsKSB7XG4gICAgICAgICAqICAgICAgICAgICAgICAvLyB2YWwgaXMgYW4gb2JqZWN0IHdpdGggdGhlIHZhbHVlcyBvZiB0aGUgcmVxdWVzdGVkIHZhcmlhYmxlczogdmFsLnByaWNlLCB2YWwuc2FsZXNcbiAgICAgICAgICogICAgICAgICAgfSk7XG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMucXVlcnkoeyBpbmNsdWRlOlsncHJpY2UnLCAnc2FsZXMnXSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8QXJyYXl9IHF1ZXJ5IFRoZSBuYW1lcyBvZiB0aGUgdmFyaWFibGVzIHJlcXVlc3RlZC5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG91dHB1dE1vZGlmaWVyIChPcHRpb25hbCkgQXZhaWxhYmxlIGZpZWxkcyBpbmNsdWRlOiBgc3RhcnRyZWNvcmRgLCBgZW5kcmVjb3JkYCwgYHNvcnRgLCBhbmQgYGRpcmVjdGlvbmAgKGBhc2NgIG9yIGBkZXNjYCkuXG4gICAgICAgICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3ZlcnJpZGVzIGZvciBjb25maWd1cmF0aW9uIG9wdGlvbnMuXG4gICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICAqL1xuICAgICAgICAgcXVlcnk6IGZ1bmN0aW9uIChxdWVyeSwgb3V0cHV0TW9kaWZpZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vUXVlcnkgYW5kIG91dHB1dE1vZGlmaWVyIGFyZSBib3RoIHF1ZXJ5c3RyaW5ncyBpbiB0aGUgdXJsOyBvbmx5IGNhbGxpbmcgdGhlbSBvdXQgc2VwYXJhdGVseSBoZXJlIHRvIGJlIGNvbnNpc3RlbnQgd2l0aCB0aGUgb3RoZXIgY2FsbHNcbiAgICAgICAgICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgIGh0dHBPcHRpb25zID0gYWRkQXV0b1Jlc3RvcmVIZWFkZXIoaHR0cE9wdGlvbnMpO1xuXG4gICAgICAgICAgICAgaWYgKCQuaXNBcnJheShxdWVyeSkpIHtcbiAgICAgICAgICAgICAgICAgcXVlcnkgPSB7IGluY2x1ZGU6IHF1ZXJ5IH07XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgICQuZXh0ZW5kKHF1ZXJ5LCBvdXRwdXRNb2RpZmllcik7XG4gICAgICAgICAgICAgcmV0dXJuIGh0dHAuc3BsaXRHZXQocXVlcnksIGh0dHBPcHRpb25zKTtcbiAgICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFNhdmUgdmFsdWVzIHRvIG1vZGVsIHZhcmlhYmxlcy4gT3ZlcndyaXRlcyBleGlzdGluZyB2YWx1ZXMuIE5vdGUgdGhhdCB5b3UgY2FuIG9ubHkgdXBkYXRlIG1vZGVsIHZhcmlhYmxlcyBpZiB0aGUgcnVuIGlzIFtpbiBtZW1vcnldKC4uLy4uLy4uL3J1bl9wZXJzaXN0ZW5jZS8jcnVucy1pbi1tZW1vcnkpLiAoQW4gYWx0ZXJuYXRlIHdheSB0byB1cGRhdGUgbW9kZWwgdmFyaWFibGVzIGlzIHRvIGNhbGwgYSBtZXRob2QgZnJvbSB0aGUgbW9kZWwgYW5kIG1ha2Ugc3VyZSB0aGF0IHRoZSBtZXRob2QgcGVyc2lzdHMgdGhlIHZhcmlhYmxlcy4gU2VlIGBkb2AsIGBzZXJpYWxgLCBhbmQgYHBhcmFsbGVsYCBpbiB0aGUgW1J1biBBUEkgU2VydmljZV0oLi4vcnVuLWFwaS1zZXJ2aWNlLykgZm9yIGNhbGxpbmcgbWV0aG9kcyBmcm9tIHRoZSBtb2RlbC4pXG4gICAgICAgICAqXG4gICAgICAgICAqICoqRXhhbXBsZSoqXG4gICAgICAgICAqXG4gICAgICAgICAqICAgICAgdnMuc2F2ZSgncHJpY2UnLCA0KTtcbiAgICAgICAgICogICAgICB2cy5zYXZlKHsgcHJpY2U6IDQsIHF1YW50aXR5OiA1LCBwcm9kdWN0czogWzIsMyw0XSB9KTtcbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R8U3RyaW5nfSB2YXJpYWJsZSBBbiBvYmplY3QgY29tcG9zZWQgb2YgdGhlIG1vZGVsIHZhcmlhYmxlcyBhbmQgdGhlIHZhbHVlcyB0byBzYXZlLiBBbHRlcm5hdGl2ZWx5LCBhIHN0cmluZyB3aXRoIHRoZSBuYW1lIG9mIHRoZSB2YXJpYWJsZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IHZhbCAoT3B0aW9uYWwpIElmIHBhc3NpbmcgYSBzdHJpbmcgZm9yIGB2YXJpYWJsZWAsIHVzZSB0aGlzIGFyZ3VtZW50IGZvciB0aGUgdmFsdWUgdG8gc2F2ZS5cbiAgICAgICAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPdmVycmlkZXMgZm9yIGNvbmZpZ3VyYXRpb24gb3B0aW9ucy5cbiAgICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgICovXG4gICAgICAgICBzYXZlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAgICAgIHZhciBhdHRycztcbiAgICAgICAgICAgICBpZiAodHlwZW9mIHZhcmlhYmxlID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICBhdHRycyA9IHZhcmlhYmxlO1xuICAgICAgICAgICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgICAgICAgfVxuICAgICAgICAgICAgIHZhciBodHRwT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LCBzZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgICB9XG5cbiAgICAgICAgLy8gTm90IEF2YWlsYWJsZSB1bnRpbCB1bmRlcmx5aW5nIEFQSSBzdXBwb3J0cyBQVVQuIE90aGVyd2lzZSBzYXZlIHdvdWxkIGJlIFBVVCBhbmQgbWVyZ2Ugd291bGQgYmUgUEFUQ0hcbiAgICAgICAgLy8gKlxuICAgICAgICAvLyAgKiBTYXZlIHZhbHVlcyB0byB0aGUgYXBpLiBNZXJnZXMgYXJyYXlzLCBidXQgb3RoZXJ3aXNlIHNhbWUgYXMgc2F2ZVxuICAgICAgICAvLyAgKiBAcGFyYW0ge09iamVjdHxTdHJpbmd9IHZhcmlhYmxlIE9iamVjdCB3aXRoIGF0dHJpYnV0ZXMsIG9yIHN0cmluZyBrZXlcbiAgICAgICAgLy8gICogQHBhcmFtIHtPYmplY3R9IHZhbCBPcHRpb25hbCBpZiBwcmV2IHBhcmFtZXRlciB3YXMgYSBzdHJpbmcsIHNldCB2YWx1ZSBoZXJlXG4gICAgICAgIC8vICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIE92ZXJyaWRlcyBmb3IgY29uZmlndXJhdGlvbiBvcHRpb25zXG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICB2cy5tZXJnZSh7IHByaWNlOiA0LCBxdWFudGl0eTogNSwgcHJvZHVjdHM6IFsyLDMsNF0gfSlcbiAgICAgICAgLy8gICogICAgIHZzLm1lcmdlKCdwcmljZScsIDQpO1xuXG4gICAgICAgIC8vIG1lcmdlOiBmdW5jdGlvbiAodmFyaWFibGUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgICAvLyAgICAgdmFyIGF0dHJzO1xuICAgICAgICAvLyAgICAgaWYgKHR5cGVvZiB2YXJpYWJsZSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gICAgICAgYXR0cnMgPSB2YXJpYWJsZTtcbiAgICAgICAgLy8gICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgLy8gICAgIH0gZWxzZSB7XG4gICAgICAgIC8vICAgICAgIChhdHRycyA9IHt9KVt2YXJpYWJsZV0gPSB2YWw7XG4gICAgICAgIC8vICAgICB9XG4gICAgICAgIC8vICAgICB2YXIgaHR0cE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMpO1xuXG4gICAgICAgIC8vICAgICByZXR1cm4gaHR0cC5wYXRjaC5jYWxsKHRoaXMsIGF0dHJzLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIC8vIH1cbiAgICAgfTtcbiAgICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbiB9O1xuIiwiLyoqXG4gKiAjIyBXb3JsZCBBUEkgQWRhcHRlclxuICpcbiAqIEEgW3J1bl0oLi4vLi4vLi4vZ2xvc3NhcnkvI3J1bikgaXMgYSBjb2xsZWN0aW9uIG9mIGVuZCB1c2VyIGludGVyYWN0aW9ucyB3aXRoIGEgcHJvamVjdCBhbmQgaXRzIG1vZGVsIC0tIGluY2x1ZGluZyBzZXR0aW5nIHZhcmlhYmxlcywgbWFraW5nIGRlY2lzaW9ucywgYW5kIGNhbGxpbmcgb3BlcmF0aW9ucy4gRm9yIGJ1aWxkaW5nIG11bHRpcGxheWVyIHNpbXVsYXRpb25zIHlvdSB0eXBpY2FsbHkgd2FudCBtdWx0aXBsZSBlbmQgdXNlcnMgdG8gc2hhcmUgdGhlIHNhbWUgc2V0IG9mIGludGVyYWN0aW9ucywgYW5kIHdvcmsgd2l0aGluIGEgY29tbW9uIHN0YXRlLiBFcGljZW50ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUgXCJ3b3JsZHNcIiB0byBoYW5kbGUgc3VjaCBjYXNlcy4gT25seSBbdGVhbSBwcm9qZWN0c10oLi4vLi4vLi4vZ2xvc3NhcnkvI3RlYW0pIGNhbiBiZSBtdWx0aXBsYXllci5cbiAqXG4gKiBUaGUgV29ybGQgQVBJIEFkYXB0ZXIgYWxsb3dzIHlvdSB0byBjcmVhdGUsIGFjY2VzcywgYW5kIG1hbmlwdWxhdGUgbXVsdGlwbGF5ZXIgd29ybGRzIHdpdGhpbiB5b3VyIEVwaWNlbnRlciBwcm9qZWN0LiBZb3UgY2FuIHVzZSB0aGlzIHRvIGFkZCBhbmQgcmVtb3ZlIGVuZCB1c2VycyBmcm9tIHRoZSB3b3JsZCwgYW5kIHRvIGNyZWF0ZSwgYWNjZXNzLCBhbmQgcmVtb3ZlIHRoZWlyIHJ1bnMuIEJlY2F1c2Ugb2YgdGhpcywgdHlwaWNhbGx5IHRoZSBXb3JsZCBBZGFwdGVyIGlzIHVzZWQgZm9yIGZhY2lsaXRhdG9yIHBhZ2VzIGluIHlvdXIgcHJvamVjdC4gKFRoZSByZWxhdGVkIFtXb3JsZCBNYW5hZ2VyXSguLi93b3JsZC1tYW5hZ2VyLykgcHJvdmlkZXMgYW4gZWFzeSB3YXkgdG8gYWNjZXNzIHJ1bnMgYW5kIHdvcmxkcyBmb3IgcGFydGljdWxhciBlbmQgdXNlcnMsIHNvIGlzIHR5cGljYWxseSB1c2VkIGluIHBhZ2VzIHRoYXQgZW5kIHVzZXJzIHdpbGwgaW50ZXJhY3Qgd2l0aC4pXG4gKlxuICogQXMgd2l0aCBhbGwgdGhlIG90aGVyIFtBUEkgQWRhcHRlcnNdKC4uLy4uLyksIGFsbCBtZXRob2RzIHRha2UgaW4gYW4gXCJvcHRpb25zXCIgb2JqZWN0IGFzIHRoZSBsYXN0IHBhcmFtZXRlci4gVGhlIG9wdGlvbnMgY2FuIGJlIHVzZWQgdG8gZXh0ZW5kL292ZXJyaWRlIHRoZSBXb3JsZCBBUEkgU2VydmljZSBkZWZhdWx0cy5cbiAqXG4gKiBUbyB1c2UgdGhlIFdvcmxkIEFkYXB0ZXIsIGluc3RhbnRpYXRlIGl0IGFuZCB0aGVuIGFjY2VzcyB0aGUgbWV0aG9kcyBwcm92aWRlZC4gSW5zdGFudGlhdGluZyByZXF1aXJlcyB0aGUgYWNjb3VudCBpZCAoKipUZWFtIElEKiogaW4gdGhlIEVwaWNlbnRlciB1c2VyIGludGVyZmFjZSksIHByb2plY3QgaWQgKCoqUHJvamVjdCBJRCoqKSwgYW5kIGdyb3VwICgqKkdyb3VwIE5hbWUqKikuXG4gKlxuICogICAgICAgdmFyIHdhID0gbmV3IEYuc2VydmljZS5Xb3JsZCh7XG4gKiAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gKiAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICogICAgICAgICAgZ3JvdXA6ICd0ZWFtMScgfSk7XG4gKiAgICAgICB3YS5jcmVhdGUoKVxuICogICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAqICAgICAgICAgICAgICAvLyBjYWxsIG1ldGhvZHMsIGUuZy4gd2EuYWRkVXNlcnMoKVxuICogICAgICAgICAgfSk7XG4gKi9cblxuJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4vY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG4vLyB2YXIgcXV0aWwgPSByZXF1aXJlKCcuLi91dGlsL3F1ZXJ5LXV0aWwnKTtcbnZhciBUcmFuc3BvcnRGYWN0b3J5ID0gcmVxdWlyZSgnLi4vdHJhbnNwb3J0L2h0dHAtdHJhbnNwb3J0LWZhY3RvcnknKTtcbnZhciBTZXNzaW9uTWFuYWdlciA9IHJlcXVpcmUoJy4uL3N0b3JlL3Nlc3Npb24tbWFuYWdlcicpO1xudmFyIF9waWNrID0gcmVxdWlyZSgnLi4vdXRpbC9vYmplY3QtdXRpbCcpLl9waWNrO1xuXG52YXIgYXBpQmFzZSA9ICdtdWx0aXBsYXllci8nO1xudmFyIGFzc2lnbm1lbnRFbmRwb2ludCA9IGFwaUJhc2UgKyAnYXNzaWduJztcbnZhciBhcGlFbmRwb2ludCA9IGFwaUJhc2UgKyAnd29ybGQnO1xudmFyIHByb2plY3RFbmRwb2ludCA9IGFwaUJhc2UgKyAncHJvamVjdCc7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuICAgIHZhciBkZWZhdWx0cyA9IHtcbiAgICAgICAgLyoqXG4gICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgKiBAc2VlIFtBdXRoZW50aWNhdGlvbiBBUEkgU2VydmljZV0oLi4vYXV0aC1hcGktc2VydmljZS8pIGZvciBnZXR0aW5nIHRva2Vucy5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRva2VuOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFRoZSBwcm9qZWN0IGlkLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAgICAgKiBAdHlwZSB7U3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcHJvamVjdDogdW5kZWZpbmVkLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIFVSTC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGFjY291bnQ6IHVuZGVmaW5lZCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogVGhlIGdyb3VwIG5hbWUuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIGdyb3VwOiB1bmRlZmluZWQsXG5cbiAgICAgICAvKipcbiAgICAgICAgICogVGhlIG1vZGVsIGZpbGUgdG8gdXNlIHRvIGNyZWF0ZSBydW5zIGluIHRoaXMgd29ybGQuIERlZmF1bHRzIHRvIHVuZGVmaW5lZC5cbiAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIG1vZGVsOiB1bmRlZmluZWQsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENyaXRlcmlhIGJ5IHdoaWNoIHRvIGZpbHRlciB3b3JsZC4gQ3VycmVudGx5IG9ubHkgc3VwcG9ydHMgd29ybGQtaWRzIGFzIGZpbHRlcnMuXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBmaWx0ZXI6ICcnLFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBDb252ZW5pZW5jZSBhbGlhcyBmb3IgZmlsdGVyXG4gICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAqL1xuICAgICAgICBpZDogJycsXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE9wdGlvbnMgdG8gcGFzcyBvbiB0byB0aGUgdW5kZXJseWluZyB0cmFuc3BvcnQgbGF5ZXIuIEFsbCBqcXVlcnkuYWpheCBvcHRpb25zIGF0IGh0dHA6Ly9hcGkuanF1ZXJ5LmNvbS9qUXVlcnkuYWpheC8gYXJlIGF2YWlsYWJsZS4gRGVmYXVsdHMgdG8gZW1wdHkgb2JqZWN0LlxuICAgICAgICAgKiBAdHlwZSB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgdHJhbnNwb3J0OiB7fSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgY29tcGxldGVzIHN1Y2Nlc3NmdWxseS4gRGVmYXVsdHMgdG8gYCQubm9vcGAuXG4gICAgICAgICAqIEB0eXBlIHtmdW5jdGlvbn1cbiAgICAgICAgICovXG4gICAgICAgIHN1Y2Nlc3M6ICQubm9vcCxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ2FsbGVkIHdoZW4gdGhlIGNhbGwgZmFpbHMuIERlZmF1bHRzIHRvIGAkLm5vb3BgLlxuICAgICAgICAgKiBAdHlwZSB7ZnVuY3Rpb259XG4gICAgICAgICAqL1xuICAgICAgICBlcnJvcjogJC5ub29wXG4gICAgfTtcblxuICAgIHRoaXMuc2Vzc2lvbk1hbmFnZXIgPSBuZXcgU2Vzc2lvbk1hbmFnZXIoKTtcbiAgICB2YXIgc2VydmljZU9wdGlvbnMgPSB0aGlzLnNlc3Npb25NYW5hZ2VyLmdldE1lcmdlZE9wdGlvbnMoZGVmYXVsdHMsIGNvbmZpZyk7XG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLmlkKSB7XG4gICAgICAgIHNlcnZpY2VPcHRpb25zLmZpbHRlciA9IHNlcnZpY2VPcHRpb25zLmlkO1xuICAgIH1cblxuICAgIHZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZShzZXJ2aWNlT3B0aW9ucykuZ2V0KCdzZXJ2ZXInKTtcblxuICAgIGlmICghc2VydmljZU9wdGlvbnMuYWNjb3VudCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5hY2NvdW50ID0gdXJsQ29uZmlnLmFjY291bnRQYXRoO1xuICAgIH1cblxuICAgIGlmICghc2VydmljZU9wdGlvbnMucHJvamVjdCkge1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucy5wcm9qZWN0ID0gdXJsQ29uZmlnLnByb2plY3RQYXRoO1xuICAgIH1cblxuICAgIHZhciB0cmFuc3BvcnRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLnRyYW5zcG9ydCwge1xuICAgICAgICB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KVxuICAgIH0pO1xuXG4gICAgaWYgKHNlcnZpY2VPcHRpb25zLnRva2VuKSB7XG4gICAgICAgIHRyYW5zcG9ydE9wdGlvbnMuaGVhZGVycyA9IHtcbiAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIHNlcnZpY2VPcHRpb25zLnRva2VuXG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgdmFyIGh0dHAgPSBuZXcgVHJhbnNwb3J0RmFjdG9yeSh0cmFuc3BvcnRPcHRpb25zKTtcblxuICAgIHZhciBzZXRJZEZpbHRlck9yVGhyb3dFcnJvciA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zLmlkKSB7XG4gICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSBvcHRpb25zLmlkO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmZpbHRlcikge1xuICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gb3B0aW9ucy5maWx0ZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFzZXJ2aWNlT3B0aW9ucy5maWx0ZXIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gd29ybGQgaWQgc3BlY2lmaWVkIHRvIGFwcGx5IG9wZXJhdGlvbnMgYWdhaW5zdC4gVGhpcyBjb3VsZCBoYXBwZW4gaWYgdGhlIHVzZXIgaXMgbm90IGFzc2lnbmVkIHRvIGEgd29ybGQgYW5kIGlzIHRyeWluZyB0byB3b3JrIHdpdGggcnVucyBmcm9tIHRoYXQgd29ybGQuJyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgdmFyIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBpZiAoIW9wdGlvbnMubW9kZWwpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gbW9kZWwgc3BlY2lmaWVkIHRvIGdldCB0aGUgY3VycmVudCBydW4nKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgcHVibGljQVBJID0ge1xuXG4gICAgICAgIC8qKlxuICAgICAgICAqIENyZWF0ZXMgYSBuZXcgV29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiBVc2luZyB0aGlzIG1ldGhvZCBpcyByYXJlLiBJdCBpcyBtb3JlIGNvbW1vbiB0byBjcmVhdGUgd29ybGRzIGF1dG9tYXRpY2FsbHkgd2hpbGUgeW91IGBhdXRvQXNzaWduKClgIGVuZCB1c2VycyB0byB3b3JsZHMuIChJbiB0aGlzIGNhc2UsIGNvbmZpZ3VyYXRpb24gZGF0YSBmb3IgdGhlIHdvcmxkLCBzdWNoIGFzIHRoZSByb2xlcywgYXJlIHJlYWQgZnJvbSB0aGUgcHJvamVjdC1sZXZlbCB3b3JsZCBjb25maWd1cmF0aW9uIGluZm9ybWF0aW9uLCBmb3IgZXhhbXBsZSBieSBgZ2V0UHJvamVjdFNldHRpbmdzKClgLilcbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSh7XG4gICAgICAgICogICAgICAgICAgIHJvbGVzOiBbJ1ZQIE1hcmtldGluZycsICdWUCBTYWxlcycsICdWUCBFbmdpbmVlcmluZyddXG4gICAgICAgICogICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gcGFyYW1zIFBhcmFtZXRlcnMgdG8gY3JlYXRlIHRoZSB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGFyYW1zLmdyb3VwIChPcHRpb25hbCkgVGhlICoqR3JvdXAgTmFtZSoqIHRvIGNyZWF0ZSB0aGlzIHdvcmxkIHVuZGVyLiBPbmx5IGVuZCB1c2VycyBpbiB0aGlzIGdyb3VwIGFyZSBlbGlnaWJsZSB0byBqb2luIHRoZSB3b3JsZC4gT3B0aW9uYWwgaGVyZTsgcmVxdWlyZWQgd2hlbiBpbnN0YW50aWF0aW5nIHRoZSBzZXJ2aWNlIChgbmV3IEYuc2VydmljZS5Xb3JsZCgpYCkuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5yb2xlcyAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbXVzdCoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIHJvbGVzIGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5vcHRpb25hbFJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IHBhcmFtcy5taW5Vc2VycyAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGNyZWF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIGNyZWF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgc2VydmljZU9wdGlvbnMsIG9wdGlvbnMsIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgfSk7XG4gICAgICAgICAgICB2YXIgd29ybGRBcGlQYXJhbXMgPSBbJ3Njb3BlJywgJ2ZpbGVzJywgJ3JvbGVzJywgJ29wdGlvbmFsUm9sZXMnLCAnbWluVXNlcnMnLCAnZ3JvdXAnLCAnbmFtZSddO1xuICAgICAgICAgICAgdmFyIHZhbGlkUGFyYW1zID0gX3BpY2soc2VydmljZU9wdGlvbnMsIFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10pO1xuICAgICAgICAgICAgLy8gd2hpdGVsaXN0IHRoZSBmaWVsZHMgdGhhdCB3ZSBhY3R1YWxseSBjYW4gc2VuZCB0byB0aGUgYXBpXG4gICAgICAgICAgICBwYXJhbXMgPSBfcGljayhwYXJhbXMsIHdvcmxkQXBpUGFyYW1zKTtcblxuICAgICAgICAgICAgLy8gYWNjb3VudCBhbmQgcHJvamVjdCBnbyBpbiB0aGUgYm9keSwgbm90IGluIHRoZSB1cmxcbiAgICAgICAgICAgIHBhcmFtcyA9ICQuZXh0ZW5kKHt9LCB2YWxpZFBhcmFtcywgcGFyYW1zKTtcblxuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3MgPSBjcmVhdGVPcHRpb25zLnN1Y2Nlc3M7XG4gICAgICAgICAgICBjcmVhdGVPcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgPSByZXNwb25zZS5pZDsgLy9hbGwgZnV0dXJlIGNoYWluZWQgY2FsbHMgdG8gb3BlcmF0ZSBvbiB0aGlzIGlkXG4gICAgICAgICAgICAgICAgcmV0dXJuIG9sZFN1Y2Nlc3MuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCBjcmVhdGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIGEgV29ybGQsIGZvciBleGFtcGxlIHRvIHJlcGxhY2UgdGhlIHJvbGVzIGluIHRoZSB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqIFR5cGljYWxseSwgeW91IGNvbXBsZXRlIHdvcmxkIGNvbmZpZ3VyYXRpb24gYXQgdGhlIHByb2plY3QgbGV2ZWwsIHJhdGhlciB0aGFuIGF0IHRoZSB3b3JsZCBsZXZlbC4gRm9yIGV4YW1wbGUsIGVhY2ggd29ybGQgaW4geW91ciBwcm9qZWN0IHByb2JhYmx5IGhhcyB0aGUgc2FtZSByb2xlcyBmb3IgZW5kIHVzZXJzLiBBbmQgeW91ciBwcm9qZWN0IGlzIHByb2JhYmx5IGVpdGhlciBjb25maWd1cmVkIHNvIHRoYXQgYWxsIGVuZCB1c2VycyBzaGFyZSB0aGUgc2FtZSB3b3JsZCAoYW5kIHJ1biksIG9yIHNtYWxsZXIgc2V0cyBvZiBlbmQgdXNlcnMgc2hhcmUgd29ybGRzIOKAlCBidXQgbm90IGJvdGguIEhvd2V2ZXIsIHRoaXMgbWV0aG9kIGlzIGF2YWlsYWJsZSBpZiB5b3UgbmVlZCB0byB1cGRhdGUgdGhlIGNvbmZpZ3VyYXRpb24gb2YgYSBwYXJ0aWN1bGFyIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLnVwZGF0ZSh7IHJvbGVzOiBbJ1ZQIE1hcmtldGluZycsICdWUCBTYWxlcycsICdWUCBFbmdpbmVlcmluZyddIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBwYXJhbXMgUGFyYW1ldGVycyB0byB1cGRhdGUgdGhlIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSBwYXJhbXMubmFtZSBBIHN0cmluZyBpZGVudGlmaWVyIGZvciB0aGUgbGlua2VkIGVuZCB1c2VycywgZm9yIGV4YW1wbGUsIFwibmFtZVwiOiBcIk91ciBUZWFtXCIuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5yb2xlcyAoT3B0aW9uYWwpIFRoZSBsaXN0IG9mIHJvbGVzIChzdHJpbmdzKSBmb3IgdGhpcyB3b3JsZC4gU29tZSB3b3JsZHMgaGF2ZSBzcGVjaWZpYyByb2xlcyB0aGF0ICoqbXVzdCoqIGJlIGZpbGxlZCBieSBlbmQgdXNlcnMuIExpc3RpbmcgdGhlIHJvbGVzIGFsbG93cyB5b3UgdG8gYXV0b2Fzc2lnbiB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IGFsbCByb2xlcyBhcmUgZmlsbGVkIGluIGVhY2ggd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IHBhcmFtcy5vcHRpb25hbFJvbGVzIChPcHRpb25hbCkgVGhlIGxpc3Qgb2Ygb3B0aW9uYWwgcm9sZXMgKHN0cmluZ3MpIGZvciB0aGlzIHdvcmxkLiBTb21lIHdvcmxkcyBoYXZlIHNwZWNpZmljIHJvbGVzIHRoYXQgKiptYXkqKiBiZSBmaWxsZWQgYnkgZW5kIHVzZXJzLiBMaXN0aW5nIHRoZSBvcHRpb25hbCByb2xlcyBhcyBwYXJ0IG9mIHRoZSB3b3JsZCBvYmplY3QgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIHVzZXJzIHRvIHdvcmxkcyBhbmQgZW5zdXJlIHRoYXQgYWxsIHJvbGVzIGFyZSBmaWxsZWQgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge2ludGVnZXJ9IHBhcmFtcy5taW5Vc2VycyAoT3B0aW9uYWwpIFRoZSBtaW5pbXVtIG51bWJlciBvZiB1c2VycyBmb3IgdGhlIHdvcmxkLiBJbmNsdWRpbmcgdGhpcyBudW1iZXIgYWxsb3dzIHlvdSB0byBhdXRvYXNzaWduIGVuZCB1c2VycyB0byB3b3JsZHMgYW5kIGVuc3VyZSB0aGF0IHRoZSBjb3JyZWN0IG51bWJlciBvZiB1c2VycyBhcmUgaW4gZWFjaCB3b3JsZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHdoaXRlbGlzdCA9IFsncm9sZXMnLCAnb3B0aW9uYWxSb2xlcycsICdtaW5Vc2VycyddO1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gICAgICAgICAgICBzZXRJZEZpbHRlck9yVGhyb3dFcnJvcihvcHRpb25zKTtcblxuICAgICAgICAgICAgdmFyIHVwZGF0ZU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcGFyYW1zID0gX3BpY2socGFyYW1zIHx8IHt9LCB3aGl0ZWxpc3QpO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChwYXJhbXMsIHVwZGF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIERlbGV0ZXMgYW4gZXhpc3Rpbmcgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiBUaGlzIGZ1bmN0aW9uIG9wdGlvbmFsbHkgdGFrZXMgb25lIGFyZ3VtZW50LiBJZiB0aGUgYXJndW1lbnQgaXMgYSBzdHJpbmcsIGl0IGlzIHRoZSBpZCBvZiB0aGUgd29ybGQgdG8gZGVsZXRlLiBJZiB0aGUgYXJndW1lbnQgaXMgYW4gb2JqZWN0LCBpdCBpcyB0aGUgb3ZlcnJpZGUgZm9yIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmRlbGV0ZSgpO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7U3RyaW5nfE9iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIFRoZSBpZCBvZiB0aGUgd29ybGQgdG8gZGVsZXRlLCBvciBvcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gKG9wdGlvbnMgJiYgKHR5cGVvZiBvcHRpb25zID09PSAnc3RyaW5nJykpID8geyBmaWx0ZXI6IG9wdGlvbnMgfSA6IHt9O1xuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBVcGRhdGVzIHRoZSBjb25maWd1cmF0aW9uIGZvciB0aGUgY3VycmVudCBpbnN0YW5jZSBvZiB0aGUgV29ybGQgQVBJIEFkYXB0ZXIgKGluY2x1ZGluZyBhbGwgc3Vic2VxdWVudCBmdW5jdGlvbiBjYWxscywgdW50aWwgdGhlIGNvbmZpZ3VyYXRpb24gaXMgdXBkYXRlZCBhZ2FpbikuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHsuLi59KS51cGRhdGVDb25maWcoeyBmaWx0ZXI6ICcxMjMnIH0pLmFkZFVzZXIoeyB1c2VySWQ6ICcxMjMnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gY29uZmlnIFRoZSBjb25maWd1cmF0aW9uIG9iamVjdCB0byB1c2UgaW4gdXBkYXRpbmcgZXhpc3RpbmcgY29uZmlndXJhdGlvbi5cbiAgICAgICAgKiBAcmV0dXJuIHtPYmplY3R9IHJlZmVyZW5jZSB0byBjdXJyZW50IGluc3RhbmNlXG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZUNvbmZpZzogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgJC5leHRlbmQoc2VydmljZU9wdGlvbnMsIGNvbmZpZyk7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIExpc3RzIGFsbCB3b3JsZHMgZm9yIGEgZ2l2ZW4gYWNjb3VudCwgcHJvamVjdCwgYW5kIGdyb3VwLiBBbGwgdGhyZWUgYXJlIHJlcXVpcmVkLCBhbmQgaWYgbm90IHNwZWNpZmllZCBhcyBwYXJhbWV0ZXJzLCBhcmUgcmVhZCBmcm9tIHRoZSBzZXJ2aWNlLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGxpc3RzIGFsbCB3b3JsZHMgaW4gZ3JvdXAgXCJ0ZWFtMVwiXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5saXN0KCk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGxpc3RzIGFsbCB3b3JsZHMgaW4gZ3JvdXAgXCJvdGhlci1ncm91cC1uYW1lXCJcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmxpc3QoeyBncm91cDogJ290aGVyLWdyb3VwLW5hbWUnIH0pO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAqKlBhcmFtZXRlcnMqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgbGlzdDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgZ2V0T3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgZmlsdGVycyA9IF9waWNrKGdldE9wdGlvbnMsIFsnYWNjb3VudCcsICdwcm9qZWN0JywgJ2dyb3VwJ10pO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogR2V0cyBhbGwgd29ybGRzIHRoYXQgYW4gZW5kIHVzZXIgYmVsb25ncyB0byBmb3IgYSBnaXZlbiBhY2NvdW50ICh0ZWFtKSwgcHJvamVjdCwgYW5kIGdyb3VwLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmdldFdvcmxkc0ZvclVzZXIoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIHdvcmxkcyBhcmUgYmVpbmcgcmV0cmlldmVkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0V29ybGRzRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhciBmaWx0ZXJzID0gJC5leHRlbmQoXG4gICAgICAgICAgICAgICAgX3BpY2soZ2V0T3B0aW9ucywgWydhY2NvdW50JywgJ3Byb2plY3QnLCAnZ3JvdXAnXSksXG4gICAgICAgICAgICAgICAgeyB1c2VySWQ6IHVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQoZmlsdGVycywgZ2V0T3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIExvYWQgaW5mb3JtYXRpb24gZm9yIGEgc3BlY2lmaWMgd29ybGQuIEFsbCBmdXJ0aGVyIGNhbGxzIHRvIHRoZSB3b3JsZCBzZXJ2aWNlIHdpbGwgdXNlIHRoZSBpZCBwcm92aWRlZC5cbiAgICAgICAgICpcbiAgICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgICogQHBhcmFtIHtTdHJpbmd9IHdvcmxkSWQgVGhlIGlkIG9mIHRoZSB3b3JsZCB0byBsb2FkLlxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAgKi9cbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmICh3b3JsZElkKSB7XG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghc2VydmljZU9wdGlvbnMuZmlsdGVyKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhIHdvcmxkaWQgdG8gbG9hZCcpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGh0dHBPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHNlcnZpY2VPcHRpb25zLCBvcHRpb25zLCB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy8nIH0pO1xuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZ2V0KCcnLCBodHRwT3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogQWRkcyBhbiBlbmQgdXNlciBvciBsaXN0IG9mIGVuZCB1c2VycyB0byBhIGdpdmVuIHdvcmxkLiBUaGUgZW5kIHVzZXIgbXVzdCBiZSBhIG1lbWJlciBvZiB0aGUgYGdyb3VwYCB0aGF0IGlzIGFzc29jaWF0ZWQgd2l0aCB0aGlzIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBvbmUgdXNlclxuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoWydiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnXSk7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2Vycyh7IHVzZXJJZDogJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHJvbGU6ICdWUCBTYWxlcycgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAgICAgICAgICAgICAgIC8vIGFkZCBzZXZlcmFsIHVzZXJzXG4gICAgICAgICogICAgICAgICAgICAgICB3YS5hZGRVc2VycyhbXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgeyB1c2VySWQ6ICdhNmZlMGMxZS1mNGI4LTRmMDEtOWY1Zi0wMWNjZjRjMmVkNDQnLFxuICAgICAgICAqICAgICAgICAgICAgICAgICAgICAgcm9sZTogJ1ZQIE1hcmtldGluZycgfSxcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB7IHVzZXJJZDogJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScsXG4gICAgICAgICogICAgICAgICAgICAgICAgICAgICByb2xlOiAnVlAgRW5naW5lZXJpbmcnIH1cbiAgICAgICAgKiAgICAgICAgICAgICAgIF0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICAgICAgICAgICAvLyBhZGQgb25lIHVzZXIgdG8gYSBzcGVjaWZpYyB3b3JsZFxuICAgICAgICAqICAgICAgICAgICAgICAgd2EuYWRkVXNlcnMoJ2IxYzE5ZGRhLTJkMmUtNDc3Ny1hZDVkLTM5MjlmMTdlODZkMycsIHdvcmxkLmlkKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKCdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCB7IGZpbHRlcjogd29ybGQuaWQgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfG9iamVjdHxhcnJheX0gdXNlcnMgVXNlciBpZCwgYXJyYXkgb2YgdXNlciBpZHMsIG9iamVjdCwgb3IgYXJyYXkgb2Ygb2JqZWN0cyBvZiB0aGUgdXNlcnMgdG8gYWRkIHRvIHRoaXMgd29ybGQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHVzZXJzLnJvbGUgVGhlIGByb2xlYCB0aGUgdXNlciBzaG91bGQgaGF2ZSBpbiB0aGUgd29ybGQuIEl0IGlzIHVwIHRvIHRoZSBjYWxsZXIgdG8gZW5zdXJlLCBpZiBuZWVkZWQsIHRoYXQgdGhlIGByb2xlYCBwYXNzZWQgaW4gaXMgb25lIG9mIHRoZSBgcm9sZXNgIG9yIGBvcHRpb25hbFJvbGVzYCBvZiB0aGlzIHdvcmxkLlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB3b3JsZElkIFRoZSB3b3JsZCB0byB3aGljaCB0aGUgdXNlcnMgc2hvdWxkIGJlIGFkZGVkLiBJZiBub3Qgc3BlY2lmaWVkLCB0aGUgZmlsdGVyIHBhcmFtZXRlciBvZiB0aGUgYG9wdGlvbnNgIG9iamVjdCBpcyB1c2VkLlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChPcHRpb25hbCkgT3B0aW9ucyBvYmplY3QgdG8gb3ZlcnJpZGUgZ2xvYmFsIG9wdGlvbnMuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgYWRkVXNlcnM6IGZ1bmN0aW9uICh1c2Vycywgd29ybGRJZCwgb3B0aW9ucykge1xuXG4gICAgICAgICAgICBpZiAoIXVzZXJzKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdQbGVhc2UgcHJvdmlkZSBhIGxpc3Qgb2YgdXNlcnMgdG8gYWRkIHRvIHRoZSB3b3JsZCcpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBub3JtYWxpemUgdGhlIGxpc3Qgb2YgdXNlcnMgdG8gYW4gYXJyYXkgb2YgdXNlciBvYmplY3RzXG4gICAgICAgICAgICB1c2VycyA9ICQubWFwKFtdLmNvbmNhdCh1c2VycyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gJC5pc1BsYWluT2JqZWN0KHUpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB1ICE9PSAnc3RyaW5nJyAmJiAhaXNPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTb21lIG9mIHRoZSB1c2VycyBpbiB0aGUgbGlzdCBhcmUgbm90IGluIHRoZSB2YWxpZCBmb3JtYXQ6ICcgKyB1KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gaXNPYmplY3QgPyB1IDogeyB1c2VySWQ6IHUgfTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBvcHRpb25zIHdlcmUgcGFzc2VkIGFzIHRoZSBzZWNvbmQgcGFyYW1ldGVyXG4gICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KHdvcmxkSWQpICYmICFvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9ucyA9IHdvcmxkSWQ7XG4gICAgICAgICAgICAgICAgd29ybGRJZCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICAvLyB3ZSBtdXN0IGhhdmUgb3B0aW9ucyBieSBub3dcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygd29ybGRJZCA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICBvcHRpb25zLmZpbHRlciA9IHdvcmxkSWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNldElkRmlsdGVyT3JUaHJvd0Vycm9yKG9wdGlvbnMpO1xuXG4gICAgICAgICAgICB2YXIgdXBkYXRlT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKGFwaUVuZHBvaW50KSArIHNlcnZpY2VPcHRpb25zLmZpbHRlciArICcvdXNlcnMnIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QodXNlcnMsIHVwZGF0ZU9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFVwZGF0ZXMgdGhlIHJvbGUgb2YgYW4gZW5kIHVzZXIgaW4gYSBnaXZlbiB3b3JsZC4gKFlvdSBjYW4gb25seSB1cGRhdGUgb25lIGVuZCB1c2VyIGF0IGEgdGltZS4pXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuY3JlYXRlKCkudGhlbihmdW5jdGlvbih3b3JsZCkge1xuICAgICAgICAqICAgICAgICAgICB3YS5hZGRVc2VycygnYjFjMTlkZGEtMmQyZS00Nzc3LWFkNWQtMzkyOWYxN2U4NmQzJyk7XG4gICAgICAgICogICAgICAgICAgIHdhLnVwZGF0ZVVzZXIoeyB1c2VySWQ6ICdiMWMxOWRkYS0yZDJlLTQ3NzctYWQ1ZC0zOTI5ZjE3ZTg2ZDMnLCByb2xlOiAnbGVhZGVyJyB9KTtcbiAgICAgICAgKiAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gdXNlciBVc2VyIG9iamVjdCB3aXRoIGB1c2VySWRgIGFuZCB0aGUgbmV3IGByb2xlYC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIHVwZGF0ZVVzZXI6IGZ1bmN0aW9uICh1c2VyLCBvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgaWYgKCF1c2VyIHx8ICF1c2VyLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gcGFzcyBhIHVzZXJJZCB0byB1cGRhdGUgZnJvbSB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBwYXRjaE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSxcbiAgICAgICAgICAgICAgICBzZXJ2aWNlT3B0aW9ucyxcbiAgICAgICAgICAgICAgICBvcHRpb25zLFxuICAgICAgICAgICAgICAgIHsgdXJsOiB1cmxDb25maWcuZ2V0QVBJUGF0aChhcGlFbmRwb2ludCkgKyBzZXJ2aWNlT3B0aW9ucy5maWx0ZXIgKyAnL3VzZXJzLycgKyB1c2VyLnVzZXJJZCB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wYXRjaChfcGljayh1c2VyLCAncm9sZScpLCBwYXRjaE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIFJlbW92ZXMgYW4gZW5kIHVzZXIgZnJvbSBhIGdpdmVuIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqICAgICAgd2EuY3JlYXRlKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24od29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLmFkZFVzZXJzKFsnYTZmZTBjMWUtZjRiOC00ZjAxLTlmNWYtMDFjY2Y0YzJlZDQ0JywgJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZSddKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIHdhLnJlbW92ZVVzZXIoJ2E2ZmUwYzFlLWY0YjgtNGYwMS05ZjVmLTAxY2NmNGMyZWQ0NCcpO1xuICAgICAgICAqICAgICAgICAgICAgICAgd2EucmVtb3ZlVXNlcih7IHVzZXJJZDogJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScgfSk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fHN0cmluZ30gdXNlciBUaGUgYHVzZXJJZGAgb2YgdGhlIHVzZXIgdG8gcmVtb3ZlIGZyb20gdGhlIHdvcmxkLCBvciBhbiBvYmplY3QgY29udGFpbmluZyB0aGUgYHVzZXJJZGAgZmllbGQuXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICByZW1vdmVVc2VyOiBmdW5jdGlvbiAodXNlciwgb3B0aW9ucykge1xuICAgICAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdXNlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICB1c2VyID0geyB1c2VySWQ6IHVzZXIgfTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCF1c2VyLnVzZXJJZCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignWW91IG5lZWQgdG8gcGFzcyBhIHVzZXJJZCB0byByZW1vdmUgZnJvbSB0aGUgd29ybGQnKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy91c2Vycy8nICsgdXNlci51c2VySWQgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIGh0dHAuZGVsZXRlKG51bGwsIGdldE9wdGlvbnMpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIHJ1biBpZCBvZiBjdXJyZW50IHJ1biBmb3IgdGhlIGdpdmVuIHdvcmxkLiBJZiB0aGUgd29ybGQgZG9lcyBub3QgaGF2ZSBhIHJ1biwgY3JlYXRlcyBhIG5ldyBvbmUgYW5kIHJldHVybnMgdGhlIHJ1biBpZC5cbiAgICAgICAgKlxuICAgICAgICAqIFJlbWVtYmVyIHRoYXQgYSBbcnVuXSguLi8uLi9nbG9zc2FyeS8jcnVuKSBpcyBhIGNvbGxlY3Rpb24gb2YgaW50ZXJhY3Rpb25zIHdpdGggYSBwcm9qZWN0IGFuZCBpdHMgbW9kZWwuIEluIHRoZSBjYXNlIG9mIG11bHRpcGxheWVyIHByb2plY3RzLCB0aGUgcnVuIGlzIHNoYXJlZCBieSBhbGwgZW5kIHVzZXJzIGluIHRoZSB3b3JsZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmNyZWF0ZSgpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICB3YS5nZXRDdXJyZW50UnVuSWQoeyBtb2RlbDogJ21vZGVsLnB5JyB9KTtcbiAgICAgICAgKiAgICAgICAgICAgfSk7XG4gICAgICAgICpcbiAgICAgICAgKiAqKiBQYXJhbWV0ZXJzICoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5tb2RlbCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRDdXJyZW50UnVuSWQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBnZXRPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHZhbGlkYXRlTW9kZWxPclRocm93RXJyb3IoZ2V0T3B0aW9ucyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5wb3N0KF9waWNrKGdldE9wdGlvbnMsICdtb2RlbCcpLCBnZXRPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBHZXRzIHRoZSBjdXJyZW50IChtb3N0IHJlY2VudCkgd29ybGQgZm9yIHRoZSBnaXZlbiBlbmQgdXNlciBpbiB0aGUgZ2l2ZW4gZ3JvdXAuIEJyaW5ncyB0aGlzIG1vc3QgcmVjZW50IHdvcmxkIGludG8gbWVtb3J5IGlmIG5lZWRlZC5cbiAgICAgICAgKlxuICAgICAgICAqICAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKiAgICAgIHdhLmdldEN1cnJlbnRXb3JsZEZvclVzZXIoJzhmMjYwNGNmLTk2Y2QtNDQ5Zi04MmZhLWUzMzE1MzA3MzRlZScpXG4gICAgICAgICogICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHdvcmxkKSB7XG4gICAgICAgICogICAgICAgICAgICAgICAvLyB1c2UgZGF0YSBmcm9tIHdvcmxkXG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogKiogUGFyYW1ldGVycyAqKlxuICAgICAgICAqIEBwYXJhbSB7c3RyaW5nfSB1c2VySWQgVGhlIGB1c2VySWRgIG9mIHRoZSB1c2VyIHdob3NlIGN1cnJlbnQgKG1vc3QgcmVjZW50KSB3b3JsZCBpcyBiZWluZyByZXRyaWV2ZWQuXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IGdyb3VwTmFtZSAoT3B0aW9uYWwpIFRoZSBuYW1lIG9mIHRoZSBncm91cC4gSWYgbm90IHByb3ZpZGVkLCBkZWZhdWx0cyB0byB0aGUgZ3JvdXAgdXNlZCB0byBjcmVhdGUgdGhlIHNlcnZpY2UuXG4gICAgICAgICogQHJldHVybiB7UHJvbWlzZX1cbiAgICAgICAgKi9cbiAgICAgICAgZ2V0Q3VycmVudFdvcmxkRm9yVXNlcjogZnVuY3Rpb24gKHVzZXJJZCwgZ3JvdXBOYW1lKSB7XG4gICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgICAgIHRoaXMuZ2V0V29ybGRzRm9yVXNlcih1c2VySWQsIHsgZ3JvdXA6IGdyb3VwTmFtZSB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gYXNzdW1lIHRoZSBtb3N0IHJlY2VudCB3b3JsZCBhcyB0aGUgJ2FjdGl2ZScgd29ybGRcbiAgICAgICAgICAgICAgICAgICAgd29ybGRzLnNvcnQoZnVuY3Rpb24gKGEsIGIpIHsgcmV0dXJuIG5ldyBEYXRlKGIubGFzdE1vZGlmaWVkKSAtIG5ldyBEYXRlKGEubGFzdE1vZGlmaWVkKTsgfSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyZW50V29ybGQgPSB3b3JsZHNbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRXb3JsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMuZmlsdGVyID0gY3VycmVudFdvcmxkLmlkO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZHRkLnJlc29sdmVXaXRoKG1lLCBbY3VycmVudFdvcmxkXSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcblxuICAgICAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICogRGVsZXRlcyB0aGUgY3VycmVudCBydW4gZnJvbSB0aGUgd29ybGQuXG4gICAgICAgICpcbiAgICAgICAgKiAoTm90ZSB0aGF0IHRoZSB3b3JsZCBpZCByZW1haW5zIHBhcnQgb2YgdGhlIHJ1biByZWNvcmQsIGluZGljYXRpbmcgdGhhdCB0aGUgcnVuIHdhcyBmb3JtZXJseSBhbiBhY3RpdmUgcnVuIGZvciB0aGUgd29ybGQuKVxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5kZWxldGVSdW4oJ3NhbXBsZS13b3JsZC1pZCcpO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmxkSWQgVGhlIGB3b3JsZElkYCBvZiB0aGUgd29ybGQgZnJvbSB3aGljaCB0aGUgY3VycmVudCBydW4gaXMgYmVpbmcgZGVsZXRlZC5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICovXG4gICAgICAgIGRlbGV0ZVJ1bjogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICBpZiAod29ybGRJZCkge1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuZmlsdGVyID0gd29ybGRJZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2V0SWRGaWx0ZXJPclRocm93RXJyb3Iob3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkZWxldGVPcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXBpRW5kcG9pbnQpICsgc2VydmljZU9wdGlvbnMuZmlsdGVyICsgJy9ydW4nIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLmRlbGV0ZShudWxsLCBkZWxldGVPcHRpb25zKTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBDcmVhdGVzIGEgbmV3IHJ1biBmb3IgdGhlIHdvcmxkLlxuICAgICAgICAqXG4gICAgICAgICogICoqRXhhbXBsZSoqXG4gICAgICAgICpcbiAgICAgICAgKiAgICAgIHZhciB3YSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoe1xuICAgICAgICAqICAgICAgICAgICBhY2NvdW50OiAnYWNtZS1zaW11bGF0aW9ucycsXG4gICAgICAgICogICAgICAgICAgIHByb2plY3Q6ICdzdXBwbHktY2hhaW4tZ2FtZScsXG4gICAgICAgICogICAgICAgICAgIGdyb3VwOiAndGVhbTEnIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICAgICB3YS5nZXRDdXJyZW50V29ybGRGb3JVc2VyKCc4ZjI2MDRjZi05NmNkLTQ0OWYtODJmYS1lMzMxNTMwNzM0ZWUnKVxuICAgICAgICAqICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgICAgICB3YS5uZXdSdW5Gb3JXb3JsZCh3b3JsZC5pZCk7XG4gICAgICAgICogICAgICAgICAgIH0pO1xuICAgICAgICAqXG4gICAgICAgICogICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtzdHJpbmd9IHdvcmxkSWQgd29ybGRJZCBpbiB3aGljaCB3ZSBjcmVhdGUgdGhlIG5ldyBydW4uXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucy5tb2RlbCBUaGUgbW9kZWwgZmlsZSB0byB1c2UgdG8gY3JlYXRlIGEgcnVuIGlmIG5lZWRlZC5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBuZXdSdW5Gb3JXb3JsZDogZnVuY3Rpb24gKHdvcmxkSWQsIG9wdGlvbnMpIHtcbiAgICAgICAgICAgIHZhciBjdXJyZW50UnVuT3B0aW9ucyA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyBmaWx0ZXI6IHdvcmxkSWQgfHwgc2VydmljZU9wdGlvbnMuZmlsdGVyIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICB2YXIgbWUgPSB0aGlzO1xuXG4gICAgICAgICAgICB2YWxpZGF0ZU1vZGVsT3JUaHJvd0Vycm9yKGN1cnJlbnRSdW5PcHRpb25zKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVsZXRlUnVuKHdvcmxkSWQsIG9wdGlvbnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWUuZ2V0Q3VycmVudFJ1bklkKGN1cnJlbnRSdW5PcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgKiBBc3NpZ25zIGVuZCB1c2VycyB0byB3b3JsZHMsIGNyZWF0aW5nIG5ldyB3b3JsZHMgYXMgYXBwcm9wcmlhdGUsIGF1dG9tYXRpY2FsbHkuIEFzc2lnbnMgYWxsIGVuZCB1c2VycyBpbiB0aGUgZ3JvdXAsIGFuZCBjcmVhdGVzIG5ldyB3b3JsZHMgYXMgbmVlZGVkIGJhc2VkIG9uIHRoZSBwcm9qZWN0LWxldmVsIHdvcmxkIGNvbmZpZ3VyYXRpb24gKHJvbGVzLCBvcHRpb25hbCByb2xlcywgYW5kIG1pbmltdW0gZW5kIHVzZXJzIHBlciB3b3JsZCkuXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuYXV0b0Fzc2lnbigpO1xuICAgICAgICAqXG4gICAgICAgICogKipQYXJhbWV0ZXJzKipcbiAgICAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0aW9ucyAoT3B0aW9uYWwpIE9wdGlvbnMgb2JqZWN0IHRvIG92ZXJyaWRlIGdsb2JhbCBvcHRpb25zLlxuICAgICAgICAqIEByZXR1cm4ge1Byb21pc2V9XG4gICAgICAgICpcbiAgICAgICAgKi9cbiAgICAgICAgYXV0b0Fzc2lnbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgICAgICB2YXIgb3B0ID0gJC5leHRlbmQodHJ1ZSwge30sXG4gICAgICAgICAgICAgICAgc2VydmljZU9wdGlvbnMsXG4gICAgICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgICAgICAgICB7IHVybDogdXJsQ29uZmlnLmdldEFQSVBhdGgoYXNzaWdubWVudEVuZHBvaW50KSB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgIGFjY291bnQ6IG9wdC5hY2NvdW50LFxuICAgICAgICAgICAgICAgIHByb2plY3Q6IG9wdC5wcm9qZWN0LFxuICAgICAgICAgICAgICAgIGdyb3VwOiBvcHQuZ3JvdXBcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChvcHQubWF4VXNlcnMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXMubWF4VXNlcnMgPSBvcHQubWF4VXNlcnM7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBodHRwLnBvc3QocGFyYW1zLCBvcHQpO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAqIEdldHMgdGhlIHByb2plY3QncyB3b3JsZCBjb25maWd1cmF0aW9uLlxuICAgICAgICAqXG4gICAgICAgICogVHlwaWNhbGx5LCBldmVyeSBpbnRlcmFjdGlvbiB3aXRoIHlvdXIgcHJvamVjdCB1c2VzIHRoZSBzYW1lIGNvbmZpZ3VyYXRpb24gb2YgZWFjaCB3b3JsZC4gRm9yIGV4YW1wbGUsIGVhY2ggd29ybGQgaW4geW91ciBwcm9qZWN0IHByb2JhYmx5IGhhcyB0aGUgc2FtZSByb2xlcyBmb3IgZW5kIHVzZXJzLiBBbmQgeW91ciBwcm9qZWN0IGlzIHByb2JhYmx5IGVpdGhlciBjb25maWd1cmVkIHNvIHRoYXQgYWxsIGVuZCB1c2VycyBzaGFyZSB0aGUgc2FtZSB3b3JsZCAoYW5kIHJ1biksIG9yIHNtYWxsZXIgc2V0cyBvZiBlbmQgdXNlcnMgc2hhcmUgd29ybGRzIOKAlCBidXQgbm90IGJvdGguXG4gICAgICAgICpcbiAgICAgICAgKiAoVGhlIFtNdWx0aXBsYXllciBQcm9qZWN0IFJFU1QgQVBJXSguLi8uLi8uLi9yZXN0X2FwaXMvbXVsdGlwbGF5ZXIvbXVsdGlwbGF5ZXJfcHJvamVjdC8pIGFsbG93cyB5b3UgdG8gc2V0IHRoZXNlIHByb2plY3QtbGV2ZWwgd29ybGQgY29uZmlndXJhdGlvbnMuIFRoZSBXb3JsZCBBZGFwdGVyIHNpbXBseSByZXRyaWV2ZXMgdGhlbSwgZm9yIGV4YW1wbGUgc28gdGhleSBjYW4gYmUgdXNlZCBpbiBhdXRvLWFzc2lnbm1lbnQgb2YgZW5kIHVzZXJzIHRvIHdvcmxkcy4pXG4gICAgICAgICpcbiAgICAgICAgKiAqKkV4YW1wbGUqKlxuICAgICAgICAqXG4gICAgICAgICogICAgICB2YXIgd2EgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKHtcbiAgICAgICAgKiAgICAgICAgICAgYWNjb3VudDogJ2FjbWUtc2ltdWxhdGlvbnMnLFxuICAgICAgICAqICAgICAgICAgICBwcm9qZWN0OiAnc3VwcGx5LWNoYWluLWdhbWUnLFxuICAgICAgICAqICAgICAgICAgICBncm91cDogJ3RlYW0xJyB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICAgICAgd2EuZ2V0UHJvamVjdFNldHRpbmdzKClcbiAgICAgICAgKiAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24oc2V0dGluZ3MpIHtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLnJvbGVzKTtcbiAgICAgICAgKiAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHNldHRpbmdzLm9wdGlvbmFsUm9sZXMpO1xuICAgICAgICAqICAgICAgICAgICB9KTtcbiAgICAgICAgKlxuICAgICAgICAqICoqUGFyYW1ldGVycyoqXG4gICAgICAgICogQHBhcmFtIHtvYmplY3R9IG9wdGlvbnMgKE9wdGlvbmFsKSBPcHRpb25zIG9iamVjdCB0byBvdmVycmlkZSBnbG9iYWwgb3B0aW9ucy5cbiAgICAgICAgKiBAcmV0dXJuIHtQcm9taXNlfVxuICAgICAgICAqL1xuICAgICAgICBnZXRQcm9qZWN0U2V0dGluZ3M6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICAgICAgdmFyIG9wdCA9ICQuZXh0ZW5kKHRydWUsIHt9LFxuICAgICAgICAgICAgICAgIHNlcnZpY2VPcHRpb25zLFxuICAgICAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgICAgICAgICAgeyB1cmw6IHVybENvbmZpZy5nZXRBUElQYXRoKHByb2plY3RFbmRwb2ludCkgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgb3B0LnVybCArPSBbb3B0LmFjY291bnQsIG9wdC5wcm9qZWN0XS5qb2luKCcvJyk7XG4gICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQobnVsbCwgb3B0KTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuIiwiLyoqXG4gKiBAY2xhc3MgQ29va2llIFN0b3JhZ2UgU2VydmljZVxuICpcbiAqIEBleGFtcGxlXG4gKiAgICAgIHZhciBwZW9wbGUgPSByZXF1aXJlKCdjb29raWUtc3RvcmUnKSh7IHJvb3Q6ICdwZW9wbGUnIH0pO1xuICAgICAgICBwZW9wbGVcbiAgICAgICAgICAgIC5zYXZlKHtsYXN0TmFtZTogJ3NtaXRoJyB9KVxuXG4gKi9cblxuXG4ndXNlIHN0cmljdCc7XG5cbi8vIFRoaW4gZG9jdW1lbnQuY29va2llIHdyYXBwZXIgdG8gYWxsb3cgdW5pdCB0ZXN0aW5nXG52YXIgQ29va2llID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZ2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQuY29va2llO1xuICAgIH07XG5cbiAgICB0aGlzLnNldCA9IGZ1bmN0aW9uIChuZXdDb29raWUpIHtcbiAgICAgICAgZG9jdW1lbnQuY29va2llID0gbmV3Q29va2llO1xuICAgIH07XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICB2YXIgaG9zdCA9IHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZTtcbiAgICB2YXIgdmFsaWRIb3N0ID0gaG9zdC5zcGxpdCgnLicpLmxlbmd0aCA+IDE7XG4gICAgdmFyIGRvbWFpbiA9IHZhbGlkSG9zdCA/ICcuJyArIGhvc3QgOiBudWxsO1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICAvKipcbiAgICAgICAgICogTmFtZSBvZiBjb2xsZWN0aW9uXG4gICAgICAgICAqIEB0eXBlIHsgc3RyaW5nfVxuICAgICAgICAgKi9cbiAgICAgICAgcm9vdDogJy8nLFxuXG4gICAgICAgIGRvbWFpbjogZG9tYWluLFxuICAgICAgICBjb29raWU6IG5ldyBDb29raWUoKVxuICAgIH07XG4gICAgdGhpcy5zZXJ2aWNlT3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciBwdWJsaWNBUEkgPSB7XG4gICAgICAgIC8vICogVEJEXG4gICAgICAgIC8vICAqIFF1ZXJ5IGNvbGxlY3Rpb247IHVzZXMgTW9uZ29EQiBzeW50YXhcbiAgICAgICAgLy8gICogQHNlZSAgPFRCRDogRGF0YSBBUEkgVVJMPlxuICAgICAgICAvLyAgKlxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IHFzIFF1ZXJ5IEZpbHRlclxuICAgICAgICAvLyAgKiBAcGFyYW0geyBzdHJpbmd9IGxpbWl0ZXJzIEBzZWUgPFRCRDogdXJsIGZvciBsaW1pdHMsIHBhZ2luZyBldGM+XG4gICAgICAgIC8vICAqXG4gICAgICAgIC8vICAqIEBleGFtcGxlXG4gICAgICAgIC8vICAqICAgICBjcy5xdWVyeShcbiAgICAgICAgLy8gICogICAgICB7IG5hbWU6ICdKb2huJywgY2xhc3NOYW1lOiAnQ1NDMTAxJyB9LFxuICAgICAgICAvLyAgKiAgICAgIHtsaW1pdDogMTB9XG4gICAgICAgIC8vICAqICAgICApXG5cbiAgICAgICAgLy8gcXVlcnk6IGZ1bmN0aW9uIChxcywgbGltaXRlcnMpIHtcblxuICAgICAgICAvLyB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBTYXZlIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEBwYXJhbSAge09iamVjdH0gdmFsdWUgKE9wdGlvbmFsKVxuICAgICAgICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyBPdmVycmlkZXMgZm9yIHNlcnZpY2Ugb3B0aW9uc1xuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJuIHsqfSBUaGUgc2F2ZWQgdmFsdWVcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLnNldCgncGVyc29uJywgeyBmaXJzdE5hbWU6ICdqb2huJywgbGFzdE5hbWU6ICdzbWl0aCcgfSk7XG4gICAgICAgICAqICAgICBjcy5zZXQoeyBuYW1lOidzbWl0aCcsIGFnZTonMzInIH0pO1xuICAgICAgICAgKi9cbiAgICAgICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNldE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5zZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSBzZXRPcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gc2V0T3B0aW9ucy5yb290O1xuICAgICAgICAgICAgdmFyIGNvb2tpZSA9IHNldE9wdGlvbnMuY29va2llO1xuXG4gICAgICAgICAgICBjb29raWUuc2V0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICsgJz0nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jb2RlVVJJQ29tcG9uZW50KHZhbHVlKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChwYXRoID8gJzsgcGF0aD0nICsgcGF0aCA6ICcnKVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBMb2FkIGNvb2tpZSB2YWx1ZVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfE9iamVjdH0ga2V5ICAgSWYgZ2l2ZW4gYSBrZXkgc2F2ZSB2YWx1ZXMgdW5kZXIgaXQsIGlmIGdpdmVuIGFuIG9iamVjdCBkaXJlY3RseSwgc2F2ZSB0byB0b3AtbGV2ZWwgYXBpXG4gICAgICAgICAqIEByZXR1cm4geyp9IFRoZSB2YWx1ZSBzdG9yZWRcbiAgICAgICAgICpcbiAgICAgICAgICogQGV4YW1wbGVcbiAgICAgICAgICogICAgIGNzLmdldCgncGVyc29uJyk7XG4gICAgICAgICAqL1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHZhciBjb29raWUgPSB0aGlzLnNlcnZpY2VPcHRpb25zLmNvb2tpZTtcbiAgICAgICAgICAgIHZhciBjb29raWVSZWcgPSBuZXcgUmVnRXhwKCcoPzpefDspXFxcXHMqJyArIGVuY29kZVVSSUNvbXBvbmVudChrZXkpLnJlcGxhY2UoL1tcXC1cXC5cXCtcXCpdL2csICdcXFxcJCYnKSArICdcXFxccypcXFxcPVxcXFxzKihbXjtdKikuKiQnKTtcbiAgICAgICAgICAgIHZhciByZXMgPSBjb29raWVSZWcuZXhlYyhjb29raWUuZ2V0KCkpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IHJlcyA/IGRlY29kZVVSSUNvbXBvbmVudChyZXNbMV0pIDogbnVsbDtcbiAgICAgICAgICAgIHJldHVybiB2YWw7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIFJlbW92ZXMga2V5IGZyb20gY29sbGVjdGlvblxuICAgICAgICAgKiBAcGFyYW0geyBzdHJpbmd9IGtleSBrZXkgdG8gcmVtb3ZlXG4gICAgICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIChvcHRpb25hbCkgb3ZlcnJpZGVzIGZvciBzZXJ2aWNlIG9wdGlvbnNcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ30ga2V5IFRoZSBrZXkgcmVtb3ZlZFxuICAgICAgICAgKlxuICAgICAgICAgKiBAZXhhbXBsZVxuICAgICAgICAgKiAgICAgY3MucmVtb3ZlKCdwZXJzb24nKTtcbiAgICAgICAgICovXG4gICAgICAgIHJlbW92ZTogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHJlbU9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgdGhpcy5zZXJ2aWNlT3B0aW9ucywgb3B0aW9ucyk7XG5cbiAgICAgICAgICAgIHZhciBkb21haW4gPSByZW1PcHRpb25zLmRvbWFpbjtcbiAgICAgICAgICAgIHZhciBwYXRoID0gcmVtT3B0aW9ucy5yb290O1xuICAgICAgICAgICAgdmFyIGNvb2tpZSA9IHJlbU9wdGlvbnMuY29va2llO1xuXG4gICAgICAgICAgICBjb29raWUuc2V0KGVuY29kZVVSSUNvbXBvbmVudChrZXkpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPTsgZXhwaXJlcz1UaHUsIDAxIEphbiAxOTcwIDAwOjAwOjAwIEdNVCcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChkb21haW4gPyAnOyBkb21haW49JyArIGRvbWFpbiA6ICcnKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHBhdGggPyAnOyBwYXRoPScgKyBwYXRoIDogJycpXG4gICAgICAgICAgICApO1xuICAgICAgICAgICAgcmV0dXJuIGtleTtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogUmVtb3ZlcyBjb2xsZWN0aW9uIGJlaW5nIHJlZmVyZW5jZWRcbiAgICAgICAgICogQHJldHVybiB7IGFycmF5fSBrZXlzIEFsbCB0aGUga2V5cyByZW1vdmVkXG4gICAgICAgICAqL1xuICAgICAgICBkZXN0cm95OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgY29va2llID0gdGhpcy5zZXJ2aWNlT3B0aW9ucy5jb29raWU7XG4gICAgICAgICAgICB2YXIgYUtleXMgPSBjb29raWUuZ2V0KCkucmVwbGFjZSgvKCg/Ol58XFxzKjspW15cXD1dKykoPz07fCQpfF5cXHMqfFxccyooPzpcXD1bXjtdKik/KD86XFwxfCQpL2csICcnKS5zcGxpdCgvXFxzKig/OlxcPVteO10qKT87XFxzKi8pO1xuICAgICAgICAgICAgZm9yICh2YXIgbklkeCA9IDA7IG5JZHggPCBhS2V5cy5sZW5ndGg7IG5JZHgrKykge1xuICAgICAgICAgICAgICAgIHZhciBjb29raWVLZXkgPSBkZWNvZGVVUklDb21wb25lbnQoYUtleXNbbklkeF0pO1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKGNvb2tpZUtleSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gYUtleXM7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgJC5leHRlbmQodGhpcywgcHVibGljQVBJKTtcbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBrZXlOYW1lcyA9IHJlcXVpcmUoJy4uL21hbmFnZXJzL2tleS1uYW1lcycpO1xudmFyIFN0b3JhZ2VGYWN0b3J5ID0gcmVxdWlyZSgnLi9zdG9yZS1mYWN0b3J5Jyk7XG52YXIgb3B0aW9uVXRpbHMgPSByZXF1aXJlKCcuLi91dGlsL29wdGlvbi11dGlscycpO1xuXG52YXIgRVBJX1NFU1NJT05fS0VZID0ga2V5TmFtZXMuRVBJX1NFU1NJT05fS0VZO1xudmFyIGRlZmF1bHRzID0ge1xuICAgIC8qKlxuICAgICAqIFdoZXJlIHRvIHN0b3JlIHVzZXIgYWNjZXNzIHRva2VucyBmb3IgdGVtcG9yYXJ5IGFjY2Vzcy4gRGVmYXVsdHMgdG8gc3RvcmluZyBpbiBhIGNvb2tpZSBpbiB0aGUgYnJvd3Nlci5cbiAgICAgKiBAdHlwZSB7c3RyaW5nfVxuICAgICAqL1xuICAgIHN0b3JlOiB7IHN5bmNocm9ub3VzOiB0cnVlIH1cbn07XG5cbnZhciBTZXNzaW9uTWFuYWdlciA9IGZ1bmN0aW9uIChtYW5hZ2VyT3B0aW9ucykge1xuICAgIG1hbmFnZXJPcHRpb25zID0gbWFuYWdlck9wdGlvbnMgfHwge307XG4gICAgZnVuY3Rpb24gZ2V0QmFzZU9wdGlvbnMob3ZlcnJpZGVzKSB7XG4gICAgICAgIG92ZXJyaWRlcyA9IG92ZXJyaWRlcyB8fCB7fTtcbiAgICAgICAgdmFyIGxpYk9wdGlvbnMgPSBvcHRpb25VdGlscy5nZXRPcHRpb25zKCk7XG4gICAgICAgIHZhciBmaW5hbE9wdGlvbnMgPSAkLmV4dGVuZCh0cnVlLCB7fSwgZGVmYXVsdHMsIGxpYk9wdGlvbnMsIG1hbmFnZXJPcHRpb25zLCBvdmVycmlkZXMpO1xuICAgICAgICByZXR1cm4gZmluYWxPcHRpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFN0b3JlKG92ZXJyaWRlcykge1xuICAgICAgICB2YXIgYmFzZU9wdGlvbnMgPSBnZXRCYXNlT3B0aW9ucyhvdmVycmlkZXMpO1xuICAgICAgICB2YXIgc3RvcmVPcHRzID0gYmFzZU9wdGlvbnMuc3RvcmUgfHwge307XG4gICAgICAgIHZhciBpc0VwaWNlbnRlckRvbWFpbiA9ICFiYXNlT3B0aW9ucy5pc0xvY2FsICYmICFiYXNlT3B0aW9ucy5pc0N1c3RvbURvbWFpbjtcbiAgICAgICAgaWYgKHN0b3JlT3B0cy5yb290ID09PSB1bmRlZmluZWQgJiYgYmFzZU9wdGlvbnMuYWNjb3VudCAmJiBiYXNlT3B0aW9ucy5wcm9qZWN0ICYmIGlzRXBpY2VudGVyRG9tYWluKSB7XG4gICAgICAgICAgICBzdG9yZU9wdHMucm9vdCA9ICcvYXBwLycgKyBiYXNlT3B0aW9ucy5hY2NvdW50ICsgJy8nICsgYmFzZU9wdGlvbnMucHJvamVjdDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IFN0b3JhZ2VGYWN0b3J5KHN0b3JlT3B0cyk7XG4gICAgfVxuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgc2F2ZVNlc3Npb246IGZ1bmN0aW9uICh1c2VySW5mbywgb3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIHNlcmlhbGl6ZWQgPSBKU09OLnN0cmluZ2lmeSh1c2VySW5mbyk7XG4gICAgICAgICAgICBnZXRTdG9yZShvcHRpb25zKS5zZXQoRVBJX1NFU1NJT05fS0VZLCBzZXJpYWxpemVkKTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U2Vzc2lvbjogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgICAgIC8vIHZhciBzZXNzaW9uID0gZ2V0U3RvcmUob3B0aW9ucykuZ2V0KEVQSV9TRVNTSU9OX0tFWSkgfHwgJ3t9JztcbiAgICAgICAgICAgIC8vIHJldHVybiBKU09OLnBhcnNlKHNlc3Npb24pO1xuICAgICAgICAgICAgdmFyIHN0b3JlID0gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgICAgICB2YXIgZmluYWxPcHRzID0gc3RvcmUuc2VydmljZU9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgc2VyaWFsaXplZCA9IHN0b3JlLmdldChFUElfU0VTU0lPTl9LRVkpIHx8ICd7fSc7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IEpTT04ucGFyc2Uoc2VyaWFsaXplZCk7XG4gICAgICAgICAgICAvLyBJZiB0aGUgdXJsIGNvbnRhaW5zIHRoZSBwcm9qZWN0IGFuZCBhY2NvdW50XG4gICAgICAgICAgICAvLyB2YWxpZGF0ZSB0aGUgYWNjb3VudCBhbmQgcHJvamVjdCBpbiB0aGUgc2Vzc2lvblxuICAgICAgICAgICAgLy8gYW5kIG92ZXJyaWRlIHByb2plY3QsIGdyb3VwTmFtZSwgZ3JvdXBJZCBhbmQgaXNGYWNcbiAgICAgICAgICAgIC8vIE90aGVyd2lzZSAoaS5lLiBsb2NhbGhvc3QpIHVzZSB0aGUgc2F2ZWQgc2Vzc2lvbiB2YWx1ZXNcbiAgICAgICAgICAgIHZhciBhY2NvdW50ID0gZmluYWxPcHRzLmFjY291bnQ7XG4gICAgICAgICAgICB2YXIgcHJvamVjdCA9IGZpbmFsT3B0cy5wcm9qZWN0O1xuICAgICAgICAgICAgaWYgKGFjY291bnQgJiYgc2Vzc2lvbi5hY2NvdW50ICE9PSBhY2NvdW50KSB7XG4gICAgICAgICAgICAgICAgLy8gVGhpcyBtZWFucyB0aGF0IHRoZSB0b2tlbiB3YXMgbm90IHVzZWQgdG8gbG9naW4gdG8gdGhlIHNhbWUgYWNjb3VudFxuICAgICAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzZXNzaW9uLmdyb3VwcyAmJiBhY2NvdW50ICYmIHByb2plY3QpIHtcbiAgICAgICAgICAgICAgICB2YXIgZ3JvdXAgPSBzZXNzaW9uLmdyb3Vwc1twcm9qZWN0XSB8fCB7IGdyb3VwSWQ6ICcnLCBncm91cE5hbWU6ICcnLCBpc0ZhYzogZmFsc2UgfTtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZChzZXNzaW9uLCB7IHByb2plY3Q6IHByb2plY3QgfSwgZ3JvdXApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgICAgIH0sXG4gICAgICAgIHJlbW92ZVNlc3Npb246IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICB2YXIgc3RvcmUgPSBnZXRTdG9yZShvcHRpb25zKTtcbiAgICAgICAgICAgIE9iamVjdC5rZXlzKGtleU5hbWVzKS5mb3JFYWNoKGZ1bmN0aW9uIChjb29raWVLZXkpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29va2llTmFtZSA9IGtleU5hbWVzW2Nvb2tpZUtleV07XG4gICAgICAgICAgICAgICAgc3RvcmUucmVtb3ZlKGNvb2tpZU5hbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2V0U3RvcmU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0U3RvcmUob3B0aW9ucyk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0TWVyZ2VkT3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpO1xuICAgICAgICAgICAgdmFyIG92ZXJyaWRlcyA9ICQuZXh0ZW5kLmFwcGx5KCQsIFt0cnVlLCB7fV0uY29uY2F0KGFyZ3MpKTtcbiAgICAgICAgICAgIHZhciBiYXNlT3B0aW9ucyA9IGdldEJhc2VPcHRpb25zKG92ZXJyaWRlcyk7XG4gICAgICAgICAgICB2YXIgc2Vzc2lvbiA9IHRoaXMuZ2V0U2Vzc2lvbihvdmVycmlkZXMpO1xuXG4gICAgICAgICAgICB2YXIgc2Vzc2lvbkRlZmF1bHRzID0ge1xuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEZvciBwcm9qZWN0cyB0aGF0IHJlcXVpcmUgYXV0aGVudGljYXRpb24sIHBhc3MgaW4gdGhlIHVzZXIgYWNjZXNzIHRva2VuIChkZWZhdWx0cyB0byBlbXB0eSBzdHJpbmcpLiBJZiB0aGUgdXNlciBpcyBhbHJlYWR5IGxvZ2dlZCBpbiB0byBFcGljZW50ZXIsIHRoZSB1c2VyIGFjY2VzcyB0b2tlbiBpcyBhbHJlYWR5IHNldCBpbiBhIGNvb2tpZSBhbmQgYXV0b21hdGljYWxseSBsb2FkZWQgZnJvbSB0aGVyZS4gKFNlZSBbbW9yZSBiYWNrZ3JvdW5kIG9uIGFjY2VzcyB0b2tlbnNdKC4uLy4uLy4uL3Byb2plY3RfYWNjZXNzLykpLlxuICAgICAgICAgICAgICAgICAqIEBzZWUgW0F1dGhlbnRpY2F0aW9uIEFQSSBTZXJ2aWNlXSguLi9hdXRoLWFwaS1zZXJ2aWNlLykgZm9yIGdldHRpbmcgdG9rZW5zLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgdG9rZW46IHNlc3Npb24uYXV0aF90b2tlbixcblxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRoZSBhY2NvdW50LiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgY29va2llIHNlc3Npb24uXG4gICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBhY2NvdW50OiBzZXNzaW9uLmFjY291bnQsXG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUaGUgcHJvamVjdC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIGNvb2tpZSBzZXNzaW9uLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgcHJvamVjdDogc2Vzc2lvbi5wcm9qZWN0LFxuXG5cbiAgICAgICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAgICAgKiBUaGUgZ3JvdXAgbmFtZS4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIGNvb2tpZSBzZXNzaW9uLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZ3JvdXA6IHNlc3Npb24uZ3JvdXBOYW1lLFxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIEFsaWFzIGZvciBncm91cC4gXG4gICAgICAgICAgICAgICAgICogQHR5cGUge1N0cmluZ31cbiAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICBncm91cE5hbWU6IHNlc3Npb24uZ3JvdXBOYW1lLCAvL0l0J3MgYSBsaXR0bGUgd2VpcmQgdGhhdCBpdCdzIGNhbGxlZCBncm91cE5hbWUgaW4gdGhlIGNvb2tpZSwgYnV0ICdncm91cCcgaW4gYWxsIHRoZSBzZXJ2aWNlIG9wdGlvbnMsIHNvIG5vcm1hbGl6ZSBmb3IgYm90aFxuICAgICAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICAgICAqIFRoZSBncm91cCBpZC4gSWYgbGVmdCB1bmRlZmluZWQsIHRha2VuIGZyb20gdGhlIGNvb2tpZSBzZXNzaW9uLlxuICAgICAgICAgICAgICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgZ3JvdXBJZDogc2Vzc2lvbi5ncm91cElkLFxuICAgICAgICAgICAgICAgIHVzZXJJZDogc2Vzc2lvbi51c2VySWRcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwgc2Vzc2lvbkRlZmF1bHRzLCBiYXNlT3B0aW9ucyk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgICQuZXh0ZW5kKHRoaXMsIHB1YmxpY0FQSSk7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFNlc3Npb25NYW5hZ2VyOyIsIi8qKlxuICAgIERlY2lkZXMgdHlwZSBvZiBzdG9yZSB0byBwcm92aWRlXG4qL1xuXG4ndXNlIHN0cmljdCc7XG4vLyB2YXIgaXNOb2RlID0gZmFsc2U7IEZJWE1FOiBCcm93c2VyaWZ5L21pbmlmeWlmeSBoYXMgaXNzdWVzIHdpdGggdGhlIG5leHQgbGlua1xuLy8gdmFyIHN0b3JlID0gKGlzTm9kZSkgPyByZXF1aXJlKCcuL3Nlc3Npb24tc3RvcmUnKSA6IHJlcXVpcmUoJy4vY29va2llLXN0b3JlJyk7XG52YXIgc3RvcmUgPSByZXF1aXJlKCcuL2Nvb2tpZS1zdG9yZScpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHN0b3JlO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcXV0aWxzID0gcmVxdWlyZSgnLi4vdXRpbC9xdWVyeS11dGlsJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGNvbmZpZykge1xuXG4gICAgdmFyIGRlZmF1bHRzID0ge1xuICAgICAgICB1cmw6ICcnLFxuXG4gICAgICAgIGNvbnRlbnRUeXBlOiAnYXBwbGljYXRpb24vanNvbicsXG4gICAgICAgIGhlYWRlcnM6IHt9LFxuICAgICAgICBzdGF0dXNDb2RlOiB7XG4gICAgICAgICAgICA0MDQ6ICQubm9vcFxuICAgICAgICB9LFxuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBPTkxZIGZvciBzdHJpbmdzIGluIHRoZSB1cmwuIEFsbCBHRVQgJiBERUxFVEUgcGFyYW1zIGFyZSBydW4gdGhyb3VnaCB0aGlzXG4gICAgICAgICAqIEB0eXBlIHtbdHlwZV0gfVxuICAgICAgICAgKi9cbiAgICAgICAgcGFyYW1ldGVyUGFyc2VyOiBxdXRpbHMudG9RdWVyeUZvcm1hdCxcblxuICAgICAgICAvLyBUbyBhbGxvdyBlcGljZW50ZXIudG9rZW4gYW5kIG90aGVyIHNlc3Npb24gY29va2llcyB0byBiZSBwYXNzZWRcbiAgICAgICAgLy8gd2l0aCB0aGUgcmVxdWVzdHNcbiAgICAgICAgeGhyRmllbGRzOiB7XG4gICAgICAgICAgICB3aXRoQ3JlZGVudGlhbHM6IHRydWVcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICB2YXIgdHJhbnNwb3J0T3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBkZWZhdWx0cywgY29uZmlnKTtcblxuICAgIHZhciByZXN1bHQgPSBmdW5jdGlvbiAoZCkge1xuICAgICAgICByZXR1cm4gKCQuaXNGdW5jdGlvbihkKSkgPyBkKCkgOiBkO1xuICAgIH07XG5cbiAgICB2YXIgY29ubmVjdCA9IGZ1bmN0aW9uIChtZXRob2QsIHBhcmFtcywgY29ubmVjdE9wdGlvbnMpIHtcbiAgICAgICAgcGFyYW1zID0gcmVzdWx0KHBhcmFtcyk7XG4gICAgICAgIHBhcmFtcyA9ICgkLmlzUGxhaW5PYmplY3QocGFyYW1zKSB8fCAkLmlzQXJyYXkocGFyYW1zKSkgPyBKU09OLnN0cmluZ2lmeShwYXJhbXMpIDogcGFyYW1zO1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQodHJ1ZSwge30sIHRyYW5zcG9ydE9wdGlvbnMsIGNvbm5lY3RPcHRpb25zLCB7XG4gICAgICAgICAgICB0eXBlOiBtZXRob2QsXG4gICAgICAgICAgICBkYXRhOiBwYXJhbXNcbiAgICAgICAgfSk7XG4gICAgICAgIHZhciBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUyA9IFsnZGF0YScsICd1cmwnXTtcbiAgICAgICAgJC5lYWNoKG9wdGlvbnMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKHZhbHVlKSAmJiAkLmluQXJyYXkoa2V5LCBBTExPV0VEX1RPX0JFX0ZVTkNUSU9OUykgIT09IC0xKSB7XG4gICAgICAgICAgICAgICAgb3B0aW9uc1trZXldID0gdmFsdWUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgaWYgKG9wdGlvbnMubG9nTGV2ZWwgJiYgb3B0aW9ucy5sb2dMZXZlbCA9PT0gJ0RFQlVHJykge1xuICAgICAgICAgICAgY29uc29sZS5sb2cob3B0aW9ucy51cmwpO1xuICAgICAgICAgICAgdmFyIG9sZFN1Y2Nlc3NGbiA9IG9wdGlvbnMuc3VjY2VzcyB8fCAkLm5vb3A7XG4gICAgICAgICAgICBvcHRpb25zLnN1Y2Nlc3MgPSBmdW5jdGlvbiAocmVzcG9uc2UsIGFqYXhTdGF0dXMsIGFqYXhSZXEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgb2xkU3VjY2Vzc0ZuLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGJlZm9yZVNlbmQgPSBvcHRpb25zLmJlZm9yZVNlbmQ7XG4gICAgICAgIG9wdGlvbnMuYmVmb3JlU2VuZCA9IGZ1bmN0aW9uICh4aHIsIHNldHRpbmdzKSB7XG4gICAgICAgICAgICB4aHIucmVxdWVzdFVybCA9IChjb25uZWN0T3B0aW9ucyB8fCB7fSkudXJsO1xuICAgICAgICAgICAgaWYgKGJlZm9yZVNlbmQpIHtcbiAgICAgICAgICAgICAgICBiZWZvcmVTZW5kLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuICQuYWpheChvcHRpb25zKTtcbiAgICB9O1xuXG4gICAgdmFyIHB1YmxpY0FQSSA9IHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbiAocGFyYW1zLCBhamF4T3B0aW9ucykge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdHJhbnNwb3J0T3B0aW9ucywgYWpheE9wdGlvbnMpO1xuICAgICAgICAgICAgcGFyYW1zID0gb3B0aW9ucy5wYXJhbWV0ZXJQYXJzZXIocmVzdWx0KHBhcmFtcykpO1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnR0VUJywgcGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgfSxcbiAgICAgICAgc3BsaXRHZXQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB9LFxuICAgICAgICBwb3N0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3Bvc3QnXS5jb25jYXQoW10uc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XG4gICAgICAgIH0sXG4gICAgICAgIHBhdGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gY29ubmVjdC5hcHBseSh0aGlzLCBbJ3BhdGNoJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBwdXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsncHV0J10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uIChwYXJhbXMsIGFqYXhPcHRpb25zKSB7XG4gICAgICAgICAgICAvL0RFTEVURSBkb2Vzbid0IHN1cHBvcnQgYm9keSBwYXJhbXMsIGJ1dCBqUXVlcnkgdGhpbmtzIGl0IGRvZXMuXG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0cmFuc3BvcnRPcHRpb25zLCBhamF4T3B0aW9ucyk7XG4gICAgICAgICAgICBwYXJhbXMgPSBvcHRpb25zLnBhcmFtZXRlclBhcnNlcihyZXN1bHQocGFyYW1zKSk7XG4gICAgICAgICAgICBpZiAoJC50cmltKHBhcmFtcykpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGVsaW1pdGVyID0gKHJlc3VsdChvcHRpb25zLnVybCkuaW5kZXhPZignPycpID09PSAtMSkgPyAnPycgOiAnJic7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy51cmwgPSByZXN1bHQob3B0aW9ucy51cmwpICsgZGVsaW1pdGVyICsgcGFyYW1zO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuY2FsbCh0aGlzLCAnREVMRVRFJywgbnVsbCwgb3B0aW9ucyk7XG4gICAgICAgIH0sXG4gICAgICAgIGhlYWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBjb25uZWN0LmFwcGx5KHRoaXMsIFsnaGVhZCddLmNvbmNhdChbXS5zbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcbiAgICAgICAgfSxcbiAgICAgICAgb3B0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIGNvbm5lY3QuYXBwbHkodGhpcywgWydvcHRpb25zJ10uY29uY2F0KFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzKSkpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiAkLmV4dGVuZCh0aGlzLCBwdWJsaWNBUEkpO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLy8gdmFyIGlzTm9kZSA9IGZhbHNlOyBGSVhNRTogQnJvd3NlcmlmeS9taW5pZnlpZnkgaGFzIGlzc3VlcyB3aXRoIHRoZSBuZXh0IGxpbmtcbi8vIHZhciB0cmFuc3BvcnQgPSAoaXNOb2RlKSA/IHJlcXVpcmUoJy4vbm9kZS1odHRwLXRyYW5zcG9ydCcpIDogcmVxdWlyZSgnLi9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG52YXIgdHJhbnNwb3J0ID0gcmVxdWlyZSgnLi9hamF4LWh0dHAtdHJhbnNwb3J0Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IHRyYW5zcG9ydDtcbiIsIi8qKlxuLyogSW5oZXJpdCBmcm9tIGEgY2xhc3MgKHVzaW5nIHByb3RvdHlwZSBib3Jyb3dpbmcpXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpbmhlcml0KEMsIFApIHtcbiAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIEYucHJvdG90eXBlID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUgPSBuZXcgRigpO1xuICAgIEMuX19zdXBlciA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQztcbn1cblxuLyoqXG4qIFNoYWxsb3cgY29weSBvZiBhbiBvYmplY3RcbiogQHBhcmFtIHtPYmplY3R9IGRlc3Qgb2JqZWN0IHRvIGV4dGVuZFxuKiBAcmV0dXJuIHtPYmplY3R9IGV4dGVuZGVkIG9iamVjdFxuKi9cbnZhciBleHRlbmQgPSBmdW5jdGlvbiAoZGVzdCAvKiwgdmFyX2FyZ3MqLykge1xuICAgIHZhciBvYmogPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIHZhciBjdXJyZW50O1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgb2JqLmxlbmd0aDsgaisrKSB7XG4gICAgICAgIGlmICghKGN1cnJlbnQgPSBvYmpbal0pKSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBkbyBub3Qgd3JhcCBpbm5lciBpbiBkZXN0Lmhhc093blByb3BlcnR5IG9yIGJhZCB0aGluZ3Mgd2lsbCBoYXBwZW5cbiAgICAgICAgZm9yICh2YXIga2V5IGluIGN1cnJlbnQpIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICBkZXN0W2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhc2UsIHByb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSBiYXNlO1xuICAgIHZhciBjaGlsZDtcblxuICAgIGNoaWxkID0gcHJvcHMgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgPyBwcm9wcy5jb25zdHJ1Y3RvciA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuXG4gICAgLy8gYWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjaGlsZCBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgIGV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBhc3NvY2lhdGUgcHJvdG90eXBlIGNoYWluXG4gICAgaW5oZXJpdChjaGlsZCwgcGFyZW50KTtcblxuICAgIC8vIGFkZCBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgaWYgKHByb3BzKSB7XG4gICAgICAgIGV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBkb25lXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcbiIsIid1c2Ugc3RyaWN0JztcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgX3BpY2s6IGZ1bmN0aW9uIChvYmosIHByb3BzKSB7XG4gICAgICAgIHZhciByZXMgPSB7fTtcbiAgICAgICAgZm9yICh2YXIgcCBpbiBvYmopIHtcbiAgICAgICAgICAgIGlmIChwcm9wcy5pbmRleE9mKHApICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIHJlc1twXSA9IG9ialtwXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXM7XG4gICAgfSxcbiAgICBpc0VtcHR5OiBmdW5jdGlvbiBpc0VtcHR5KHZhbHVlKSB7XG4gICAgICAgIHJldHVybiAoIXZhbHVlIHx8ICgkLmlzUGxhaW5PYmplY3QodmFsdWUpICYmIE9iamVjdC5rZXlzKHZhbHVlKS5sZW5ndGggPT09IDApKTtcbiAgICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQ29uZmlnU2VydmljZSA9IHJlcXVpcmUoJy4uL3NlcnZpY2UvY29uZmlndXJhdGlvbi1zZXJ2aWNlJyk7XG5cbnZhciB1cmxDb25maWcgPSBuZXcgQ29uZmlnU2VydmljZSgpLmdldCgnc2VydmVyJyk7XG52YXIgY3VzdG9tRGVmYXVsdHMgPSB7fTtcbnZhciBsaWJEZWZhdWx0cyA9IHtcbiAgICAvKipcbiAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgYWNjb3VudDogdXJsQ29uZmlnLmFjY291bnRQYXRoIHx8IHVuZGVmaW5lZCxcbiAgICAvKipcbiAgICAgKiBUaGUgYWNjb3VudCBpZC4gSW4gdGhlIEVwaWNlbnRlciBVSSwgdGhpcyBpcyB0aGUgKipUZWFtIElEKiogKGZvciB0ZWFtIHByb2plY3RzKSBvciAqKlVzZXIgSUQqKiAoZm9yIHBlcnNvbmFsIHByb2plY3RzKS4gRGVmYXVsdHMgdG8gZW1wdHkgc3RyaW5nLiBJZiBsZWZ0IHVuZGVmaW5lZCwgdGFrZW4gZnJvbSB0aGUgVVJMLlxuICAgICAqIEB0eXBlIHtTdHJpbmd9XG4gICAgICovXG4gICAgcHJvamVjdDogdXJsQ29uZmlnLnByb2plY3RQYXRoIHx8IHVuZGVmaW5lZCxcbiAgICBpc0xvY2FsOiB1cmxDb25maWcuaXNMb2NhbGhvc3QoKSxcbiAgICBpc0N1c3RvbURvbWFpbjogdXJsQ29uZmlnLmlzQ3VzdG9tRG9tYWluLFxuICAgIHN0b3JlOiB7fVxufTtcblxudmFyIG9wdGlvblV0aWxzID0ge1xuICAgIC8qKlxuICAgICAqIEdldHMgdGhlIGZpbmFsIG9wdGlvbnMgYnkgb3ZlcnJpZGluZyB0aGUgZ2xvYmFsIG9wdGlvbnMgc2V0IHdpdGhcbiAgICAgKiBvcHRpb25VdGlscyNzZXREZWZhdWx0cygpIGFuZCB0aGUgbGliIGRlZmF1bHRzLlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBvcHRpb25zIFRoZSBmaW5hbCBvcHRpb25zIG9iamVjdC5cbiAgICAgKiBAcmV0dXJuIHtvYmplY3R9IEV4dGVuZGVkIG9iamVjdFxuICAgICAqL1xuICAgIGdldE9wdGlvbnM6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiAkLmV4dGVuZCh0cnVlLCB7fSwgbGliRGVmYXVsdHMsIGN1c3RvbURlZmF1bHRzLCBvcHRpb25zKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICAqIFNldHMgdGhlIGdsb2JhbCBkZWZhdWx0cyBmb3IgdGhlIG9wdGlvblV0aWxzI2dldE9wdGlvbnMoKSBtZXRob2QuXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRlZmF1bHRzIFRoZSBkZWZhdWx0cyBvYmplY3QuXG4gICAgICovXG4gICAgc2V0RGVmYXVsdHM6IGZ1bmN0aW9uIChkZWZhdWx0cykge1xuICAgICAgICBjdXN0b21EZWZhdWx0cyA9IGRlZmF1bHRzO1xuICAgIH1cbn07XG5tb2R1bGUuZXhwb3J0cyA9IG9wdGlvblV0aWxzO1xuIiwiLyoqXG4gKiBVdGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCBxdWVyeSBzdHJpbmdzXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbiAoKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgdG8gbWF0cml4IGZvcm1hdFxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R9IHFzIE9iamVjdCB0byBjb252ZXJ0IHRvIHF1ZXJ5IHN0cmluZ1xuICAgICAgICAgKiBAcmV0dXJuIHsgc3RyaW5nfSAgICBNYXRyaXgtZm9ybWF0IHF1ZXJ5IHBhcmFtZXRlcnNcbiAgICAgICAgICovXG4gICAgICAgIHRvTWF0cml4Rm9ybWF0OiBmdW5jdGlvbiAocXMpIHtcbiAgICAgICAgICAgIGlmIChxcyA9PT0gbnVsbCB8fCBxcyA9PT0gdW5kZWZpbmVkIHx8IHFzID09PSAnJykge1xuICAgICAgICAgICAgICAgIHJldHVybiAnOyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIHFzID09PSAnc3RyaW5nJyB8fCBxcyBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBxcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJldHVybkFycmF5ID0gW107XG4gICAgICAgICAgICB2YXIgT1BFUkFUT1JTID0gWyc8JywgJz4nLCAnISddO1xuICAgICAgICAgICAgJC5lYWNoKHFzLCBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnIHx8ICQuaW5BcnJheSgkLnRyaW0odmFsdWUpLmNoYXJBdCgwKSwgT1BFUkFUT1JTKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAnPScgKyB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuQXJyYXkucHVzaChrZXkgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIG10cnggPSAnOycgKyByZXR1cm5BcnJheS5qb2luKCc7Jyk7XG4gICAgICAgICAgICByZXR1cm4gbXRyeDtcbiAgICAgICAgfSxcblxuICAgICAgICAvKipcbiAgICAgICAgICogQ29udmVydHMgc3RyaW5ncy9hcnJheXMvb2JqZWN0cyB0byB0eXBlICdhPWImYj1jJ1xuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfEFycmF5fE9iamVjdH0gcXNcbiAgICAgICAgICogQHJldHVybiB7IHN0cmluZ31cbiAgICAgICAgICovXG4gICAgICAgIHRvUXVlcnlGb3JtYXQ6IGZ1bmN0aW9uIChxcykge1xuICAgICAgICAgICAgaWYgKHFzID09PSBudWxsIHx8IHFzID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodHlwZW9mIHFzID09PSAnc3RyaW5nJyB8fCBxcyBpbnN0YW5jZW9mIFN0cmluZykge1xuICAgICAgICAgICAgICAgIHJldHVybiBxcztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHJldHVybkFycmF5ID0gW107XG4gICAgICAgICAgICAkLmVhY2gocXMsIGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5qb2luKCcsJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3QodmFsdWUpKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vTW9zdGx5IGZvciBkYXRhIGFwaVxuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IEpTT04uc3RyaW5naWZ5KHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuQXJyYXkucHVzaChrZXkgKyAnPScgKyB2YWx1ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHJldHVybkFycmF5LmpvaW4oJyYnKTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIENvbnZlcnRzIHN0cmluZ3Mgb2YgdHlwZSAnYT1iJmI9YycgdG8geyBhOmIsIGI6Y31cbiAgICAgICAgICogQHBhcmFtICB7IHN0cmluZ30gcXNcbiAgICAgICAgICogQHJldHVybiB7b2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgcXNUb09iamVjdDogZnVuY3Rpb24gKHFzKSB7XG4gICAgICAgICAgICBpZiAocXMgPT09IG51bGwgfHwgcXMgPT09IHVuZGVmaW5lZCB8fCBxcyA9PT0gJycpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4ge307XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBxc0FycmF5ID0gcXMuc3BsaXQoJyYnKTtcbiAgICAgICAgICAgIHZhciByZXR1cm5PYmogPSB7fTtcbiAgICAgICAgICAgICQuZWFjaChxc0FycmF5LCBmdW5jdGlvbiAoaW5kZXgsIHZhbHVlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHFLZXkgPSB2YWx1ZS5zcGxpdCgnPScpWzBdO1xuICAgICAgICAgICAgICAgIHZhciBxVmFsID0gdmFsdWUuc3BsaXQoJz0nKVsxXTtcblxuICAgICAgICAgICAgICAgIGlmIChxVmFsLmluZGV4T2YoJywnKSAhPT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgcVZhbCA9IHFWYWwuc3BsaXQoJywnKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm5PYmpbcUtleV0gPSBxVmFsO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiByZXR1cm5PYmo7XG4gICAgICAgIH0sXG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE5vcm1hbGl6ZXMgYW5kIG1lcmdlcyBzdHJpbmdzIG9mIHR5cGUgJ2E9YicsIHsgYjpjfSB0byB7IGE6YiwgYjpjfVxuICAgICAgICAgKiBAcGFyYW0gIHsgc3RyaW5nfEFycmF5fE9iamVjdH0gcXMxXG4gICAgICAgICAqIEBwYXJhbSAgeyBzdHJpbmd8QXJyYXl8T2JqZWN0fSBxczJcbiAgICAgICAgICogQHJldHVybiB7T2JqZWN0fVxuICAgICAgICAgKi9cbiAgICAgICAgbWVyZ2VRUzogZnVuY3Rpb24gKHFzMSwgcXMyKSB7XG4gICAgICAgICAgICB2YXIgb2JqMSA9IHRoaXMucXNUb09iamVjdCh0aGlzLnRvUXVlcnlGb3JtYXQocXMxKSk7XG4gICAgICAgICAgICB2YXIgb2JqMiA9IHRoaXMucXNUb09iamVjdCh0aGlzLnRvUXVlcnlGb3JtYXQocXMyKSk7XG4gICAgICAgICAgICByZXR1cm4gJC5leHRlbmQodHJ1ZSwge30sIG9iajEsIG9iajIpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZFRyYWlsaW5nU2xhc2g6IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAgIGlmICghdXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICh1cmwuY2hhckF0KHVybC5sZW5ndGggLSAxKSA9PT0gJy8nKSA/IHVybCA6ICh1cmwgKyAnLycpO1xuICAgICAgICB9XG4gICAgfTtcbn0oKSk7XG5cblxuIiwiLyoqXG4gKiBVdGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCB0aGUgcnVuIHNlcnZpY2VcbiovXG4ndXNlIHN0cmljdCc7XG52YXIgcXV0aWwgPSByZXF1aXJlKCcuL3F1ZXJ5LXV0aWwnKTtcbnZhciBNQVhfVVJMX0xFTkdUSCA9IDIwNDg7XG5cbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICAvKipcbiAgICAgICAgICogcmV0dXJucyBvcGVyYXRpb25zIG9mIHRoZSBmb3JtIGBbW29wMSxvcDJdLCBbYXJnMSwgYXJnMl1dYFxuICAgICAgICAgKiBAcGFyYW0gIHtPYmplY3R8QXJyYXl8U3RyaW5nfSBvcGVyYXRpb25zIG9wZXJhdGlvbnMgdG8gcGVyZm9ybVxuICAgICAgICAgKiBAcGFyYW0gIHtBcnJheX0gYXJncyBhcmd1bWVudHMgZm9yIG9wZXJhdGlvblxuICAgICAgICAgKiBAcmV0dXJuIHtTdHJpbmd9ICAgIE1hdHJpeC1mb3JtYXQgcXVlcnkgcGFyYW1ldGVyc1xuICAgICAgICAgKi9cbiAgICAgICAgbm9ybWFsaXplT3BlcmF0aW9uczogZnVuY3Rpb24gKG9wZXJhdGlvbnMsIGFyZ3MpIHtcbiAgICAgICAgICAgIGlmICghYXJncykge1xuICAgICAgICAgICAgICAgIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXR1cm5MaXN0ID0ge1xuICAgICAgICAgICAgICAgIG9wczogW10sXG4gICAgICAgICAgICAgICAgYXJnczogW11cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfY29uY2F0ID0gZnVuY3Rpb24gKGFycikge1xuICAgICAgICAgICAgICAgIHJldHVybiAoYXJyICE9PSBudWxsICYmIGFyciAhPT0gdW5kZWZpbmVkKSA/IFtdLmNvbmNhdChhcnIpIDogW107XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAvL3sgYWRkOiBbMSwyXSwgc3VidHJhY3Q6IFsyLDRdIH1cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplUGxhaW5PYmplY3RzID0gZnVuY3Rpb24gKG9wZXJhdGlvbnMsIHJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICBpZiAoIXJldHVybkxpc3QpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuTGlzdCA9IHsgb3BzOiBbXSwgYXJnczogW10gfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJC5lYWNoKG9wZXJhdGlvbnMsIGZ1bmN0aW9uIChvcG4sIGFyZykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0Lm9wcy5wdXNoKG9wbik7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybkxpc3QuYXJncy5wdXNoKF9jb25jYXQoYXJnKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLy97IG5hbWU6ICdhZGQnLCBwYXJhbXM6IFsxXSB9XG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZVN0cnVjdHVyZWRPYmplY3RzID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0Lm9wcy5wdXNoKG9wZXJhdGlvbi5uYW1lKTtcbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0LmFyZ3MucHVzaChfY29uY2F0KG9wZXJhdGlvbi5wYXJhbXMpKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplT2JqZWN0ID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAoKG9wZXJhdGlvbi5uYW1lKSA/IF9ub3JtYWxpemVTdHJ1Y3R1cmVkT2JqZWN0cyA6IF9ub3JtYWxpemVQbGFpbk9iamVjdHMpKG9wZXJhdGlvbiwgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgX25vcm1hbGl6ZUxpdGVyYWxzID0gZnVuY3Rpb24gKG9wZXJhdGlvbiwgYXJncywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm5MaXN0Lm9wcy5wdXNoKG9wZXJhdGlvbik7XG4gICAgICAgICAgICAgICAgcmV0dXJuTGlzdC5hcmdzLnB1c2goX2NvbmNhdChhcmdzKSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldHVybkxpc3Q7XG4gICAgICAgICAgICB9O1xuXG5cbiAgICAgICAgICAgIHZhciBfbm9ybWFsaXplQXJyYXlzID0gZnVuY3Rpb24gKG9wZXJhdGlvbnMsIGFyZywgcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgIGlmICghcmV0dXJuTGlzdCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm5MaXN0ID0geyBvcHM6IFtdLCBhcmdzOiBbXSB9O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkLmVhY2gob3BlcmF0aW9ucywgZnVuY3Rpb24gKGluZGV4LCBvcG4pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcG4pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfbm9ybWFsaXplT2JqZWN0KG9wbiwgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfbm9ybWFsaXplTGl0ZXJhbHMob3BuLCBhcmdzW2luZGV4XSwgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmV0dXJuTGlzdDtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qob3BlcmF0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBfbm9ybWFsaXplT2JqZWN0KG9wZXJhdGlvbnMsIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICgkLmlzQXJyYXkob3BlcmF0aW9ucykpIHtcbiAgICAgICAgICAgICAgICBfbm9ybWFsaXplQXJyYXlzKG9wZXJhdGlvbnMsIGFyZ3MsIHJldHVybkxpc3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBfbm9ybWFsaXplTGl0ZXJhbHMob3BlcmF0aW9ucywgYXJncywgcmV0dXJuTGlzdCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXR1cm5MaXN0O1xuICAgICAgICB9LFxuXG4gICAgICAgIHNwbGl0R2V0RmFjdG9yeTogZnVuY3Rpb24gKGh0dHBPcHRpb25zKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24gKHBhcmFtcywgb3B0aW9ucykge1xuICAgICAgICAgICAgICAgIHZhciBodHRwID0gdGhpczsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICAgICAgdmFyIGdldFZhbHVlID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gb3B0aW9uc1tuYW1lXSB8fCBodHRwT3B0aW9uc1tuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHZhciBnZXRGaW5hbFVybCA9IGZ1bmN0aW9uIChwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IGdldFZhbHVlKCd1cmwnLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRhdGEgPSBwYXJhbXM7XG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZXJlIGlzIGVhc3kgKG9yIGtub3duKSB3YXkgdG8gZ2V0IHRoZSBmaW5hbCBVUkwganF1ZXJ5IGlzIGdvaW5nIHRvIHNlbmQgc29cbiAgICAgICAgICAgICAgICAgICAgLy8gd2UncmUgcmVwbGljYXRpbmcgaXQuIFRoZSBwcm9jZXNzIG1pZ2h0IGNoYW5nZSBhdCBzb21lIHBvaW50IGJ1dCBpdCBwcm9iYWJseSB3aWxsIG5vdC5cbiAgICAgICAgICAgICAgICAgICAgLy8gMS4gUmVtb3ZlIGhhc2hcbiAgICAgICAgICAgICAgICAgICAgdXJsID0gdXJsLnJlcGxhY2UoLyMuKiQvLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgIC8vIDEuIEFwcGVuZCBxdWVyeSBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXJ5UGFyYW1zID0gcXV0aWwudG9RdWVyeUZvcm1hdChkYXRhKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHF1ZXN0aW9uSWR4ID0gdXJsLmluZGV4T2YoJz8nKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHF1ZXJ5UGFyYW1zICYmIHF1ZXN0aW9uSWR4ID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB1cmwgKyAnJicgKyBxdWVyeVBhcmFtcztcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChxdWVyeVBhcmFtcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHVybCArICc/JyArIHF1ZXJ5UGFyYW1zO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB1cmw7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gZ2V0RmluYWxVcmwocGFyYW1zKTtcbiAgICAgICAgICAgICAgICAvLyBXZSBtdXN0IHNwbGl0IHRoZSBHRVQgaW4gbXVsdGlwbGUgc2hvcnQgVVJMJ3NcbiAgICAgICAgICAgICAgICAvLyBUaGUgb25seSBwcm9wZXJ0eSBhbGxvd2VkIHRvIGJlIHNwbGl0IGlzIFwiaW5jbHVkZVwiXG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtcyAmJiBwYXJhbXMuaW5jbHVkZSAmJiBlbmNvZGVVUkkodXJsKS5sZW5ndGggPiBNQVhfVVJMX0xFTkdUSCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGFyYW1zQ29weSA9ICQuZXh0ZW5kKHRydWUsIHt9LCBwYXJhbXMpO1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgcGFyYW1zQ29weS5pbmNsdWRlO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdXJsTm9JbmNsdWRlcyA9IGdldEZpbmFsVXJsKHBhcmFtc0NvcHkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IE1BWF9VUkxfTEVOR1RIIC0gdXJsTm9JbmNsdWRlcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHZhciBvbGRTdWNjZXNzID0gb3B0aW9ucy5zdWNjZXNzIHx8IGh0dHBPcHRpb25zLnN1Y2Nlc3MgfHwgJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb2xkRXJyb3IgPSBvcHRpb25zLmVycm9yIHx8IGh0dHBPcHRpb25zLmVycm9yIHx8ICQubm9vcDtcbiAgICAgICAgICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSBvcmlnaW5hbCBzdWNjZXNzIGFuZCBlcnJvciBjYWxsYmFja3NcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5zdWNjZXNzID0gJC5ub29wO1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLmVycm9yID0gJC5ub29wO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmNsdWRlID0gcGFyYW1zLmluY2x1ZGU7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJySW5jbHVkZXMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGluY2x1ZGVPcHRzID0gW2N1cnJJbmNsdWRlc107XG4gICAgICAgICAgICAgICAgICAgIHZhciBjdXJyTGVuZ3RoID0gZW5jb2RlVVJJQ29tcG9uZW50KCc/aW5jbHVkZT0nKS5sZW5ndGg7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YXJpYWJsZSA9IGluY2x1ZGUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIHdoaWxlICh2YXJpYWJsZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhckxlbmdodCA9IGVuY29kZVVSSUNvbXBvbmVudCh2YXJpYWJsZSkubGVuZ3RoO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVXNlIGEgZ3JlZWR5IGFwcHJvYWNoIGZvciBub3csIGNhbiBiZSBvcHRpbWl6ZWQgdG8gYmUgc29sdmVkIGluIGEgbW9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gZWZmaWNpZW50IHdheVxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gKyAxIGlzIHRoZSBjb21tYVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJMZW5ndGggKyB2YXJMZW5naHQgKyAxIDwgZGlmZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJJbmNsdWRlcy5wdXNoKHZhcmlhYmxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyTGVuZ3RoICs9IHZhckxlbmdodCArIDE7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJJbmNsdWRlcyA9IFt2YXJpYWJsZV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW5jbHVkZU9wdHMucHVzaChjdXJySW5jbHVkZXMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJMZW5ndGggPSAnP2luY2x1ZGU9Jy5sZW5ndGggKyB2YXJMZW5naHQ7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXJpYWJsZSA9IGluY2x1ZGUucG9wKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlcXMgPSAkLm1hcChpbmNsdWRlT3B0cywgZnVuY3Rpb24gKGluY2x1ZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXFQYXJhbXMgPSAkLmV4dGVuZCh7fSwgcGFyYW1zLCB7IGluY2x1ZGU6IGluY2x1ZGUgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gaHR0cC5nZXQocmVxUGFyYW1zLCBvcHRpb25zKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICQud2hlbi5hcHBseSgkLCByZXFzKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEVhY2ggYXJndW1lbnQgYXJlIGFycmF5cyBvZiB0aGUgYXJndW1lbnRzIG9mIGVhY2ggZG9uZSByZXF1ZXN0XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTbyB0aGUgZmlyc3QgYXJndW1lbnQgb2YgdGhlIGZpcnN0IGFycmF5IG9mIGFyZ3VtZW50cyBpcyB0aGUgZGF0YVxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzVmFsaWQgPSBhcmd1bWVudHNbMF0gJiYgYXJndW1lbnRzWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFpc1ZhbGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvdWxkIG5ldmVyIGhhcHBlbi4uLlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9sZEVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmaXJzdFJlc3BvbnNlID0gYXJndW1lbnRzWzBdWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzT2JqZWN0ID0gJC5pc1BsYWluT2JqZWN0KGZpcnN0UmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGlzUnVuQVBJID0gKGlzT2JqZWN0ICYmICQuaXNQbGFpbk9iamVjdChmaXJzdFJlc3BvbnNlLnZhcmlhYmxlcykpIHx8ICFpc09iamVjdDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc1J1bkFQSSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChpc09iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhZ2dyZWdhdGUgdGhlIHZhcmlhYmxlcyBwcm9wZXJ0eSBvbmx5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBhZ2dyZWdhdGVSdW4gPSBhcmd1bWVudHNbMF1bMF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uIChpZHgsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydW4gPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgYWdncmVnYXRlUnVuLnZhcmlhYmxlcywgcnVuLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZVJ1biwgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVSdW4sIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhcnJheSBvZiBydW5zXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEFncmVnYXRlIHZhcmlhYmxlcyBpbiBlYWNoIHJ1blxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWdncmVnYXRlZFJ1bnMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJC5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24gKGlkeCwgYXJncykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJ1bnMgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEkLmlzQXJyYXkocnVucykpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmVhY2gocnVucywgZnVuY3Rpb24gKGlkeFJ1biwgcnVuKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bi5pZCAmJiAhYWdncmVnYXRlZFJ1bnNbcnVuLmlkXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBydW4udmFyaWFibGVzID0gcnVuLnZhcmlhYmxlcyB8fCB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFJ1bnNbcnVuLmlkXSA9IHJ1bjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJ1bi5pZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVkUnVuc1tydW4uaWRdLnZhcmlhYmxlcywgcnVuLnZhcmlhYmxlcyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyB0dXJuIGl0IGludG8gYW4gYXJyYXlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWdncmVnYXRlZFJ1bnMgPSAkLm1hcChhZ2dyZWdhdGVkUnVucywgZnVuY3Rpb24gKHJ1bikgeyByZXR1cm4gcnVuOyB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb2xkU3VjY2VzcyhhZ2dyZWdhdGVkUnVucywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVkUnVucywgYXJndW1lbnRzWzBdWzFdLCBhcmd1bWVudHNbMF1bMl0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgdmFyaWFibGVzIEFQSVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFnZ3JlZ2F0ZSB0aGUgcmVzcG9uc2VcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgYWdncmVnYXRlZFZhcmlhYmxlcyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQuZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uIChpZHgsIGFyZ3MpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHZhcnMgPSBhcmdzWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBhZ2dyZWdhdGVkVmFyaWFibGVzLCB2YXJzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvbGRTdWNjZXNzKGFnZ3JlZ2F0ZWRWYXJpYWJsZXMsIGFyZ3VtZW50c1swXVsxXSwgYXJndW1lbnRzWzBdWzJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZShhZ2dyZWdhdGVkVmFyaWFibGVzLCBhcmd1bWVudHNbMF1bMV0sIGFyZ3VtZW50c1swXVsyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9sZEVycm9yLmFwcGx5KGh0dHAsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBkdGQucmVqZWN0LmFwcGx5KGR0ZCwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBodHRwLmdldChwYXJhbXMsIG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cbiAgICB9O1xufSgpKTtcbiJdfQ==
