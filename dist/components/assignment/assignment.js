(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

var templates = require('./templates');

var AssignmentRow = function (options) {
    this.$el = $('<tr>');
    this.el = this.$el[0];
    this.$ = _.partialRight($, this.$el);

    this.model = options.model;
    this.options = options;
    this.worlds = options.worlds;
    this.project = options.project;

    _.bindAll(this, ['setEditMode', 'removeEditMode', 'saveEdit', 'cancelEdit', 'updateData']);

    this.bindEvents();

};

_.extend(AssignmentRow.prototype, {

    template: templates['user-row'],

    editTemplate: templates['edit-user-row'],

    bindEvents: function () {
        this.$el.on('click', 'button.edit', this.setEditMode);
        this.$el.on('click', 'button.save', this.saveEdit);
        this.$el.on('click', 'button.cancel', this.cancelEdit);
    },

    remove: function () {
        this.$el.off('click', null, null);
        // this only gives a delay to remove the tr
        // animation of height of the tr does not work
        this.$(':checkbox').attr('checked', false);
        this.$el
            .css({ opacity: 0.3 })
            .animate({ height: 0 }, {
                duration: 300,
                complete: function () {
                    this.remove();
                }
            });
    },

    makeInactive: function () {
        return this.model.makeInactive();
    },

    setEditMode: function () {
        this.model.set('edit-mode', true);
        this.render();
    },

    removeEditMode: function () {
        this.model.set('edit-mode', false);
        this.render();
    },

    saveEdit: function () {
        var me = this;
        this.updateData();
        this.worlds
            .updateUser(this.model)
            .then(function () {
                me.removeEditMode();
                me.$el.trigger('update', me);
            });
    },

    cancelEdit: function () {
        this.removeEditMode();
    },

    render: function () {
        var templ = this.model.get('edit-mode') ? this.editTemplate : this.template;
        var vm = _.extend({
            roles: this.project.get('roles'),
            optionalRoles: this.project.get('optionalRoles'),
            worlds: this.worlds.getWorldNames(),
            newWorld: this.worlds.getNextWorldName()
        }, this.model.toJSON());

        this.$el.html(templ(vm));

        return this;
    },

    updateData: function () {
        var me = this;
        this.$('[data-field]').each(function () {
            var el = $(this);
            var field = el.data('field');
            var val = el.val();

            me.model.set(field, val);
        });
    }
});


module.exports = AssignmentRow;
},{"./templates":9}],2:[function(require,module,exports){
'use strict';

var UsersCollection = require('./users-collection');
var WorldsCollection = require('./worlds-collection');
var ProjectModel = require('./project-model');
var AssignemntRow = require('./assignment-row');
var env = require('./defaults');
var AjaxQueue = require('../../../util/ajax-queue');

function setEnvironment(options) {
    env.set(_.omit(options, 'el'));
}

var Assignment = function (options) {
    setEnvironment(options);
    this.initialize(options);
};

Assignment.prototype = {

    initialize: function (options) {
        this.el = typeof options.el === 'string' ? $(options.el)[0] : options.el;
        this.$el = $(this.el);
        this.$ = _.partialRight($, this.el);

        this.users = new UsersCollection();
        this.worlds = new WorldsCollection();
        this.project = new ProjectModel();

        _.bindAll(this, ['render', 'renderTable', 'toggleControlls', 'saveEdit', 'selectAll', 'usassignSelected', '_showUpdating', '_hideUpdating', 'autoAssignAll', 'makeUserInactive']);

        this.bindEvents();
    },

    bindEvents: function () {
        this.$el.on('update', 'tr', this.saveEdit);
        this.$el.on('click', 'input:checkbox:not(#select-all)', this.toggleControlls);
        this.$el.on('click', '#select-all', this.selectAll);
        this.$el.on('click', '.unassign-user', this.usassignSelected);
        this.$el.on('click', '.auto-assign-all', this.autoAssignAll);
        this.$el.on('click', '.make-user-inactive', this.makeUserInactive);
    },

    load: function () {

        var join = function () {
            this.worlds.setUsersCollection(this.users);
            this.worlds.joinUsers();
            this.render();
        }.bind(this);

        return $.when(
            this.worlds.fetch(),
            this.users.fetch(),
            this.project.fetch()
        ).then(join);

    },

    saveEdit: function () {
        this.worlds.fetch()
            .then(function () {
                this.worlds.joinUsers();
                this.render();
                this.updateControls();
            }.bind(this));
    },

    autoAssignAll: function () {
        this._showUpdating();
        var maxUsers = +this.$('#max-users').val();
        return this.worlds.autoAssignAll({ maxUsers: maxUsers })
            .then(this._hideUpdating)
            .fail(this._hideUpdating)
            .then(function () {
                this.worlds.joinUsers();
                this.render();
            }.bind(this));
    },

    getSelectedIds: function () {
        return this.$('tbody :checkbox:checked').map(function () {
            return $(this).data('id');
        });
    },

    findRowViews: function (ids) {
        return _.map(ids, function (id) {
            return this.rowViews[id];
        }, this);
    },

    unassignUsers: function (ids) {
        var dtd = $.Deferred();
        var done = function () {
            dtd.resolve();
        };

        // for now we need to sequence the calls to unassign users from worlds
        var queue = new AjaxQueue();

        _.each(ids, function (userId) {
            var user = this.users.getById(userId);
            user.set('world', '');
            user.set('role', '');
            queue.add(_.partial(_.bind(this.worlds.updateUser, this.worlds), user));
        }, this);

        queue.execute(this).then(done);

        return dtd.promise();
    },

    usassignSelected: function (e) {
        e.preventDefault();

        var ids = this.getSelectedIds();

        var done = function () {
            this.worlds.fetch().then(function () {
                this.worlds.joinUsers();
                this._hideUpdating();
                this.render();

            }.bind(this));
        }.bind(this);

        this._showUpdating();

        return this.unassignUsers(ids).then(done);
    },

    makeUserInactive: function (e) {
        e.preventDefault();
        var ids = this.getSelectedIds();
        var done = function () {
            this.toggleControlls();
        }.bind(this);

        var makeUsersInactive = function () {
            var rows = this.findRowViews(ids);
            // for now we need to sequence the calls to patch the users
            // since the API can only operate on one call per group at a time
            var queue = new AjaxQueue();
            _.each(rows, function (view) {
                var user = view.model;
                queue.add(function () {
                    return view.makeInactive()
                        .then(function () {
                            user.remove();
                            view.remove();
                        });
                });

            }, this);

            queue.execute(this).then(done);
        }.bind(this);

        return this.unassignUsers(ids)
            .then(makeUsersInactive);


    },

    render: function () {
        this.$('table tbody').empty();
        this.renderTable();
        this.toggleControlls();
    },

    renderTable: function () {
        this.rowViews = {};
        var rows = [];
        this.users.each(function (u) {
            var view = new AssignemntRow({ model: u, worlds: this.worlds, project: this.project });
            this.rowViews[u.get('id')] = view;
            rows.push(view.render().el);
        }, this);

        this.$('table tbody').append(rows);
    },


    updateControls: function () {
        this.updateControlsForSelection();
        this.updateAutoAssignButton();
        this.updateStatus();
    },

    updateStatus: function () {
        var incompleteWorlds = this.worlds.getIncompleteWorldsCount();
        var unassignedUsers = this.users.getUnassignedUsersCount();
        var totalWorlds = this.worlds.size();

        var usersText = 'All users have been assigned.';
        if (unassignedUsers) {
            usersText = unassignedUsers === 1 ? '1 user needs assignment.' : unassignedUsers + ' users need assignment.';
        }
        var worldsText = 'All worlds are complete.';
        if (!totalWorlds) {
            worldsText = 'No worlds have been created.';
        } else if (incompleteWorlds) {
            worldsText = incompleteWorlds === 1 ? '1 incomplete world needs attention.' : incompleteWorlds + ' incomplete worlds need attention.';
        }

        this.$('#users-status .text').text(usersText);
        this.$('#worlds-status .text').text(worldsText);

        if (unassignedUsers) {
            this.$('#users-status').addClass('incomplete');
        } else {
            this.$('#users-status').removeClass('incomplete');
        }

        if (incompleteWorlds || !totalWorlds) {
            this.$('#worlds-status').addClass('incomplete');
        } else {
            this.$('#worlds-status').removeClass('incomplete');
        }

        this.$('.status-widget').addClass('visible');
    },

    updateControlsForSelection: function () {
        var numSelected = this.$('tbody :checkbox:checked').length;
        this.$('.component.controls')[numSelected ? 'addClass' : 'removeClass']('visible');
    },

    updateAutoAssignButton: function () {

        if (this.project.isDynamicAssignment()) {
            var hasRoles = this.project.hasRoles();
            this.$('.table-controls .single').hide();
            this.$('.table-controls .dynamic').show();
            this.$('.table-controls .dynamic-no-roles-text')[hasRoles ? 'hide' : 'show']();
            this.$('.table-controls .no-roles')[hasRoles ? 'hide' : 'show']();
        } else {
            this.$('.table-controls .dynamic').hide();
            this.$('.table-controls .dynamic-no-roles-text').hide();
            this.$('.table-controls .single').show();
            this.$('.table-controls .no-roles').show();

        }

        if (this.users.allUsersAssigned()) {
            this.$('.table-controls').removeClass('visible');
        } else {
            this.$('.table-controls').addClass('visible');
        }
    },

    selectAll: function (e) {
        this.$('tbody :checkbox').prop('checked', e.target.checked);
        this.updateControls();
    },

    toggleControlls: function (e) {
        var total = this.$('tbody :checkbox');
        var checked = this.$('tbody :checkbox:checked');

        if (total.length === checked.length) {
            this.$('#select-all').attr('checked', 'checked');
        } else {
            this.$('#select-all').removeAttr('checked');
        }

        this.updateControls();
    },

    _showUpdating: function () {
        this.$el.css({ opacity: 0.4 });
    },

    _hideUpdating: function () {
        this.$el.css({ opacity: 1 });
    }

};

module.exports = Assignment;
},{"../../../util/ajax-queue":14,"./assignment-row":1,"./defaults":5,"./project-model":7,"./users-collection":11,"./worlds-collection":13}],3:[function(require,module,exports){
'use strict';

var BaseCollection = function (models, options) {
    this._models = [];
    this.options = options;
    this.initialize.apply(this, arguments);
};

_.extend(BaseCollection.prototype, {
    idAttribute: 'id',

    initialize: function (models, options) {
    },

    create: function (attr, options) {
        var m = new this.model(attr, options);
        this.set(m);
        return m;
    },

    reset: function (models, options) {
        this._models.length = 0;
        this.set(models);
    },

    remove: function (model) {
        _.remove(this._models, function (m) {
            return m === model;
        });

        delete model.collection;

        return model;
    },

    set: function (models) {
        if (!models) {
            return;
        }

        models = [].concat(models);

        if (!models.length) {
            return;
        }

        _.each(models, function (m) {
            if (!(m instanceof this.model)) {
                m = new this.model(m);
            }

            m.collection = this;

            this._models.push(m);
        }, this);

        this.sort();

        return models;
    },

    sortFn: function (a, b) {
        return b._data[this.idAttribute] - a._data[this.idAttribute];
    },

    sort: function () {
        this._models = this._models.sort(this.sortFn.bind(this));

        return this._models;
    },

    getById: function (id) {
        return _.find(this._models, function (m) {
            return m.get(this.idAttribute) === id;
        }, this);
    },

    each: function (cb, ctx) {
        return _.each(this._models, cb, ctx || this);
    },

    all: function (cb, ctx) {
        return _.all(this._models, cb, ctx || this);
    },

    toJSON: function () {
        return _.invoke(this._models, 'toJSON');
    },

    find: function (fn) {
        return _.find(this._models, fn);
    },

    filter: function (fn) {
        return _.filter(this._models, fn);
    },

    size: function () {
        return this._models.length;
    },

    map: function (fn, ctx) {
        return _.map(this._models, function (model) {
            return fn.call(ctx, model.toJSON());
        });
    },

    pluck: function (field) {
        return this.map(function (m) {
            return m[field];
        });
    }

});

module.exports = BaseCollection;
},{}],4:[function(require,module,exports){
'use strict';


var BaseModel = function (attr, options) {
    attr = _.defaults({}, attr, _.result(this, 'defaults'));
    this._data = {};
    this.set(attr, options);
    this.initialize.apply(this, arguments);
};

_.extend(BaseModel.prototype, {
    initialize: function (attr, options) {

    },

    set: function (key, val, options) {
        if (key === null) {
            return this;
        }

        var attrs;
        if (typeof key === 'object') {
            attrs = key;
            options = val;
        } else {
            (attrs = {})[key] = val;
        }

        options = options || {};

        _.extend(this._data, attrs);

        return this;
    },

    get: function (key, options) {
        return this._data[key];
    },

    remove: function () {
        if (this.collection) {
            this.collection.remove(this);
        }

        return this;
    },

    toJSON: function () {
        return this._data;
    },

    pick: function (keys) {
        return _.pick(this._data, keys);
    }

});

module.exports = BaseModel;
},{}],5:[function(require,module,exports){
'use strict';

var env = {
    account: '',
    project: '',
    group: '',
    groupId: '',
    token: '',
    server: {
        host: 'api.forio.com',
        protocol: 'https'
    }
};

module.exports = {
    set: function (options) {
        env = _.merge(env, options);
    },

    get: function () {
        return env;
    }
};
},{}],6:[function(require,module,exports){
(function () {
    'use strict';
    var App = require('./assignment.js');

    window.forio = window.forio || {};
    window.forio.MultiplayerAssignmentComponent = App;
}());

},{"./assignment.js":2}],7:[function(require,module,exports){
'use strict';

var serviceLocator = require('./service-locator');

var classFrom = require('../../../util/inherit');
var Base = require('./base-model');
// var __super = Base.prototype;

module.exports = classFrom(Base, {

    isDynamicAssignment: function () {
        return this.get('worlds') === 'dynamic';
    },

    hasRoles: function () {
        var roles = this.get('roles');
        return roles && !!roles.length;
    },

    fetch: function () {
        var api = serviceLocator.worldApi();

        return api.getProjectSettings().then(function (settings) {
            this.set(settings);
        }.bind(this));
    }
});
},{"../../../util/inherit":15,"./base-model":4,"./service-locator":8}],8:[function(require,module,exports){
'use strict';

var env = require('./defaults.js');

var cache = {};

module.exports = {
    worldApi: function () {
        if (!cache.worldApi) {
            cache.worldApi = new F.service.World(env.get());
        }

        return cache.worldApi;
    },

    memberApi: function () {
        if (!cache.memberApi) {
            cache.memberApi = new F.service.Member(_.pick(env.get(), ['groupId', 'server']));
        }

        return cache.memberApi;
    },

    userApi: function () {
        if (!cache.userApi) {
            cache.userApi = new F.service.User(_.pick(env.get(), ['account', 'server']));
        }

        return cache.userApi;
    }
};
},{"./defaults.js":5}],9:[function(require,module,exports){
exports["edit-user-row"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<td><input type="checkbox" class="select" data-id="' +
((__t = ( id )) == null ? '' : __t) +
'"</td>\n<td></td>\n<td>\n    <select name="worlds" class="form-control" data-field="world">\n\n    ';
 _.each(worlds, function (w) { ;
__p += '\n        <option value="' +
((__t = ( w )) == null ? '' : __t) +
'" ' +
((__t = ( w === world ? 'selected' : '' )) == null ? '' : __t) +
'>' +
((__t = ( w )) == null ? '' : __t) +
'</option>\n    ';
 }); ;
__p += '\n        <option value="' +
((__t = ( newWorld )) == null ? '' : __t) +
'" class="new-world-text"><i>' +
((__t = ( newWorld )) == null ? '' : __t) +
' - New -</i></option>\n    </select>\n</td>\n<td>\n    <select name="roles" class="form-control" data-field="role">\n    ';
 _.each(roles, function (r) { ;
__p += '\n        <option value="' +
((__t = ( r )) == null ? '' : __t) +
'" ' +
((__t = ( r === role ? 'selected' : '' )) == null ? '' : __t) +
'>' +
((__t = ( r )) == null ? '' : __t) +
'</option>\n    ';
 }); ;
__p += '\n\n    ';
 _.each(optionalRoles, function (r) { ;
__p += '\n        <option value="' +
((__t = ( r )) == null ? '' : __t) +
'" ' +
((__t = ( r === role ? 'selected' : '' )) == null ? '' : __t) +
'>' +
((__t = ( r )) == null ? '' : __t) +
' <i>(Optional)</i></option>\n    ';
 }); ;
__p += '\n    </select>\n</td>\n<td>' +
((__t = ( lastName )) == null ? '' : __t) +
'</td>\n<td>' +
((__t = ( userName )) == null ? '' : __t) +
'</td>\n<td>' +
((__t = ( !world ? '<em class="f-icon f-warning"></em>' : '' )) == null ? '' : __t) +
'</td>\n<td class="actions">\n    <button class="btn btn-primary btn-tools btn-save save">Save</button>\n    <button class="btn btn-tools btn-cancel cancel">Cancel</button>\n</td>';

}
return __p
};
exports["user-row"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<td><input type="checkbox" class="select" data-id="' +
((__t = ( id)) == null ? '' : __t) +
'"</td>\n<td>' +
((__t = ( !isWorldComplete ? '<em class="f-icon f-warning"></em>' : '' )) == null ? '' : __t) +
'</td>\n<td>' +
((__t = ( world )) == null ? '' : __t) +
'</td>\n<td>' +
((__t = ( role )) == null ? '' : __t) +
'</td>\n<td>' +
((__t = ( lastName )) == null ? '' : __t) +
'</td>\n<td>' +
((__t = ( userName )) == null ? '' : __t) +
'</td>\n<td>' +
((__t = ( !world ? '<em class="f-icon f-warning"></em>' : '' )) == null ? '' : __t) +
'</td>\n<td class="actions"><button class="btn edit btn-edit btn-tools auto-hide">Edit</button></td>';

}
return __p
};
},{}],10:[function(require,module,exports){
'use strict';

var classFrom = require('../../../util/inherit');
var Base = require('./base-model');
var serviceLocator = require('./service-locator');


module.exports = classFrom(Base, {
    defaults: {
        world: '',
        role: '',
        active: true,
        isWorldComplete: true,
        firstName: '',
        lastName: ''
    },

    makeActive: function () {
        var memberApi = serviceLocator.memberApi();
        var params = {
            userId: this.get('id'),
            groupId: this.get('groupId')
        };

        var original = this.get('active');
        this.set('active', true);

        return memberApi.makeUserActive(params)
            .fail(function () {
                // revert the change
                this.set('active', original);
            }.bind(this));
    },

    makeInactive: function () {
        var memberApi = serviceLocator.memberApi();
        var params = {
            userId: this.get('id'),
            groupId: this.get('groupId')
        };

        var original = this.get('active');
        this.set('active', false);

        return memberApi.makeUserInactive(params)
            .fail(function () {
                // revert the change
                this.set('active', original);
            }.bind(this));
    }

});

},{"../../../util/inherit":15,"./base-model":4,"./service-locator":8}],11:[function(require,module,exports){
'use strict';

var classFrom = require('../../../util/inherit');

var Model = require('./user-model');
var Base = require('./base-collection');
var env = require('./defaults');
var serviceLocator = require('./service-locator');


module.exports = classFrom(Base, {
    model: Model,

    sortFn: function (a, b) {
        var aw = a.get('world').toLowerCase();
        var bw = b.get('world').toLowerCase();
        if (aw !== bw) {
            return aw < bw ? -1 : 1;
        }

        return b.get('userName') > a.get('userName') ? -1 : 1;
    },

    initialize: function () {
        $.ajaxSetup({
            headers: {
                Authorization: 'Bearer ' + env.get().token
            }
        });
    },

    allUsersAssigned: function () {
        return this.all(function (u) {
            return !!u.get('world');
        });
    },

    getUnassignedUsersCount: function () {
        return this.filter(function (u) {
            return !u.get('world');
        }).length;
    },

    fetch: function () {
        var dtd = $.Deferred();
        var me = this;
        var groupId = env.get().groupId;

        var getGroupUsers = function () {
            var memberApi = serviceLocator.memberApi();
            var userApi = serviceLocator.userApi();

            var loadGroupMembers = function () {
                return memberApi.getGroupDetails();
            };

            var loadUsersInfo = function (group) {
                var nonFacAndActive = function (u) { return u.active && u.role !== 'facilitator'; };
                var users = _.pluck(_.filter(group.members, nonFacAndActive), 'userId');
                return userApi.get({ id: users });
            };

            return loadGroupMembers()
                .then(loadUsersInfo)
                .fail(dtd.reject);
        };

        getGroupUsers()
            .then(function (users) {
                users = _.map(users, function (u) { return _.extend(u, { groupId: groupId }); });
                me.set(users);
                dtd.resolve(users);
            });

        return dtd.promise();
    }

});

},{"../../../util/inherit":15,"./base-collection":3,"./defaults":5,"./service-locator":8,"./user-model":10}],12:[function(require,module,exports){
'use strict';
var serviceLocator = require('./service-locator');
var classFrom = require('../../../util/inherit');
var Base = require('./base-model');
var __super = Base.prototype;

module.exports = classFrom(Base, {

    defaults: {
        users: null,
        model: 'model.eqn'
    },

    initialize: function () {
        __super.initialize.apply(this, arguments);

        this._data.users = this._data.users || [];

        this._worldApi = serviceLocator.worldApi();

        var id = this.get('id');
        if (id) {
            this._worldApi.updateConfig({ filter: id });
        }
    },

    addUser: function (user) {
        var users = this.get('users');
        users.push(user);

        return this.save();
    },

    removeUser: function (user) {
        var id = this.get('id');
        var checkWorld = function () {
            if (!this.get('users').length) {
                this.remove();
                return this._worldApi.updateConfig({ filter: id }).delete();
            }
        }.bind(this);

        _.remove(this.get('users'), function (u) {
            return u.get('id') === user.get('id');
        });

        return this._worldApi
            .updateConfig({ filter: id })
            .removeUser({ userId: user.get('id') })
            .then(checkWorld);
    },

    save: function () {
        var me = this;
        var mapUsers = function () {
            return _.map(this.get('users'), function (u) {
                var res = { userId: u.get('id') };
                var role = u.get('role');

                if (role) {
                    res.role = role;
                }

                return res;
            });
        }.bind(this);

        var createWorld = _.partial(this._worldApi.create, this.pick(['model', 'name', 'minUsers']));
        var addUsers = _.partial(me._worldApi.addUsers, mapUsers(), { filter: me.get('id') });
        var savedUsers = this.get('users');
        if (this.isNew()) {
            // we need to create the world in the API and then add the users
            return createWorld()
                .then(function (world) {
                    me.set(world);
                    me._worldApi.updateConfig({ filter: world.id });
                })
                .then(addUsers)
                .then(function (users) {
                    // since we re-set the world, re-set the users
                    me.set('users', savedUsers);
                });
        } else {
            // the world is already created just add the users
            return addUsers();
        }
    },

    isNew: function () {
        return !this.get('lastModified');
    }

});
},{"../../../util/inherit":15,"./base-model":4,"./service-locator":8}],13:[function(require,module,exports){
'use strict';

var classFrom = require('../../../util/inherit');
var Model = require('./world-model');
var UserModel = require('./user-model');
var serviceLocator = require('./service-locator');

var Base = require('./base-collection');
var __super = Base.prototype;

var doneFn = function (dtd, after) {
    return _.after(after, dtd.resolve);
};

var worldApi;

module.exports = classFrom(Base, {
    model: Model,

    initialize: function () {
        __super.initialize.apply(this, arguments);
        worldApi = serviceLocator.worldApi();
    },

    autoAssignAll: function (options) {
        return worldApi.autoAssign(options)
            .then(function (worlds) {
                this.reset(this.parse(worlds));
            }.bind(this));
    },

    getIncompleteWorldsCount: function () {
        return this.filter(function (w) {
            return !w.get('complete');
        }).length;
    },

    updateUser: function (user) {
        var worldName = user.get('world');
        var dtd = $.Deferred();
        var prevWorld = this.getWorldByUser(user);
        var curWorld = this.getOrCreateWorld(worldName);
        var done = doneFn(dtd, 1);

        // check if there's anything to do
        if (!prevWorld && !curWorld) {
            return dtd.resolve().promise();
        }

        if (prevWorld) {
            prevWorld.removeUser(user)
                .then(function () {
                    if (curWorld) {
                        return curWorld.addUser(user);
                    }
                })
                .then(done);
        } else if (curWorld) {
            curWorld.addUser(user)
                .then(done);
        }

        return dtd.promise();
    },

    getOrCreateWorld: function (worldName) {
        if (!worldName) {
            return;
        }

        var world = this.getWordByName(worldName);

        if (!world) {
            world = this.create({ name: worldName });
        }

        return world;
    },

    getWordByName: function (worldName) {
        return this.find(function (world) {
            return world.get('name') === worldName;
        });
    },

    getWorldByUser: function (user) {
        if (!user.get) {
            throw new Error('getWorldByUser expectes a model (' + user + ')');
        }

        var id = user.get('id');
        return this.getWorldByUserId(id);
    },

    getWorldByUserId: function (userId) {
        return this.find(function (world) {
            return _.find(world.get('users'), function (u) {
                return u.get('id') === userId;
            });
        });
    },

    getWorldNames: function () {
        return this.pluck('name').sort();
    },

    getNextWorldName: function () {
        var pad = function (num, places) {
            var zeros = '000000000000000000';
            var digits = num.toString().length;
            var needed = places - digits;
            return zeros.substr(0, needed) + num;
        };

        var worlds = this.getWorldNames();

        if (!worlds.length) {
            return 'World001';
        }

        var properNames = _.filter(worlds, function (w) { return (/World\d\d\d/).test(w); }).sort();
        var lastWorld = properNames[properNames.length - 1];
        var numWorld = +lastWorld.match(/World(\d\d\d)/)[1];
        var placesToPad = 3;
        return 'World' + pad(numWorld + 1, placesToPad);
    },

    setUsersCollection: function (usersCollection) {
        this.usersCollection = usersCollection;
    },

    joinUsers: function () {
        var usersHash = {};
        var usersCollection = this.usersCollection;
        usersCollection.each(function (u) {
            u.set({ isWorldComplete: true });
            return (usersHash[u.get('id')] = u);
        });

        this.each(function (w, i) {
            var name = w.get('name');
            var isComplete = w.get('complete');
            w.set({ index: i, name: name || (i + 1) + '' });
            _.each(w.get('users'), function (u) {
                if (usersHash[u.get('userId')]) {
                    usersHash[u.get('userId')].set({ world: name, role: u.get('role'), isWorldComplete: isComplete });
                }
            });
        }, this);

        usersCollection.sort();
    },

    fetch: function () {
        return worldApi.list()
            .then(function (worlds) {
                this.reset(this.parse(worlds));
            }.bind(this));
    },

    parse: function (worlds) {
        if (worlds.length) {
            worlds = _.map(worlds, function (w) {
                var users = _.map(w.users, function (u) {
                    // in the world api users Ids comes as userId
                    // make sure we add it as id so we can use the
                    // same code to access models that come from the
                    // member/local api as with the world api
                    u.id = u.userId;
                    return new UserModel(u);
                });

                w.users = users;

                return w;
            });
        }

        return worlds;
    }
});

},{"../../../util/inherit":15,"./base-collection":3,"./service-locator":8,"./user-model":10,"./world-model":12}],14:[function(require,module,exports){
'use strict';

/**
* Utility class to make ajax calls sequencial
*/
function AjaxQueue() {
    this.queue = [];
}

$.extend(AjaxQueue.prototype, {
    add: function (fn) {
        return this.queue.push(fn);
    },

    execute: function (context) {
        var dtd = $.Deferred();
        var me = this;
        context = context || this;

        function next() {
            if (me.queue.length) {
                var fn = me.queue.shift();

                fn.call(context)
                    .then(next)
                    .fail(dtd.reject);
            } else {
                dtd.resolve();
            }
        }

        next();

        return dtd.promise();
    }
});


module.exports = AjaxQueue;
},{}],15:[function(require,module,exports){
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

},{}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Fzc2lnbm1lbnQtcm93LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9hc3NpZ25tZW50LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9iYXNlLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Jhc2UtbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2RlZmF1bHRzLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9pbmRleC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvcHJvamVjdC1tb2RlbC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvc2VydmljZS1sb2NhdG9yLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy90ZW1wbGF0ZXMuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXItbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXJzLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3dvcmxkLW1vZGVsLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy93b3JsZHMtY29sbGVjdGlvbi5qcyIsInNyYy91dGlsL2FqYXgtcXVldWUuanMiLCJzcmMvdXRpbC9pbmhlcml0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIndXNlIHN0cmljdCc7XG5cbnZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuL3RlbXBsYXRlcycpO1xuXG52YXIgQXNzaWdubWVudFJvdyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy4kZWwgPSAkKCc8dHI+Jyk7XG4gICAgdGhpcy5lbCA9IHRoaXMuJGVsWzBdO1xuICAgIHRoaXMuJCA9IF8ucGFydGlhbFJpZ2h0KCQsIHRoaXMuJGVsKTtcblxuICAgIHRoaXMubW9kZWwgPSBvcHRpb25zLm1vZGVsO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy53b3JsZHMgPSBvcHRpb25zLndvcmxkcztcbiAgICB0aGlzLnByb2plY3QgPSBvcHRpb25zLnByb2plY3Q7XG5cbiAgICBfLmJpbmRBbGwodGhpcywgWydzZXRFZGl0TW9kZScsICdyZW1vdmVFZGl0TW9kZScsICdzYXZlRWRpdCcsICdjYW5jZWxFZGl0JywgJ3VwZGF0ZURhdGEnXSk7XG5cbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcblxufTtcblxuXy5leHRlbmQoQXNzaWdubWVudFJvdy5wcm90b3R5cGUsIHtcblxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZXNbJ3VzZXItcm93J10sXG5cbiAgICBlZGl0VGVtcGxhdGU6IHRlbXBsYXRlc1snZWRpdC11c2VyLXJvdyddLFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnYnV0dG9uLmVkaXQnLCB0aGlzLnNldEVkaXRNb2RlKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJ2J1dHRvbi5zYXZlJywgdGhpcy5zYXZlRWRpdCk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICdidXR0b24uY2FuY2VsJywgdGhpcy5jYW5jZWxFZGl0KTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLm9mZignY2xpY2snLCBudWxsLCBudWxsKTtcbiAgICAgICAgLy8gdGhpcyBvbmx5IGdpdmVzIGEgZGVsYXkgdG8gcmVtb3ZlIHRoZSB0clxuICAgICAgICAvLyBhbmltYXRpb24gb2YgaGVpZ2h0IG9mIHRoZSB0ciBkb2VzIG5vdCB3b3JrXG4gICAgICAgIHRoaXMuJCgnOmNoZWNrYm94JykuYXR0cignY2hlY2tlZCcsIGZhbHNlKTtcbiAgICAgICAgdGhpcy4kZWxcbiAgICAgICAgICAgIC5jc3MoeyBvcGFjaXR5OiAwLjMgfSlcbiAgICAgICAgICAgIC5hbmltYXRlKHsgaGVpZ2h0OiAwIH0sIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG1ha2VJbmFjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5tYWtlSW5hY3RpdmUoKTtcbiAgICB9LFxuXG4gICAgc2V0RWRpdE1vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ2VkaXQtbW9kZScsIHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW1vdmVFZGl0TW9kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCgnZWRpdC1tb2RlJywgZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICBzYXZlRWRpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB0aGlzLnVwZGF0ZURhdGEoKTtcbiAgICAgICAgdGhpcy53b3JsZHNcbiAgICAgICAgICAgIC51cGRhdGVVc2VyKHRoaXMubW9kZWwpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgbWUucmVtb3ZlRWRpdE1vZGUoKTtcbiAgICAgICAgICAgICAgICBtZS4kZWwudHJpZ2dlcigndXBkYXRlJywgbWUpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNhbmNlbEVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVFZGl0TW9kZSgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRlbXBsID0gdGhpcy5tb2RlbC5nZXQoJ2VkaXQtbW9kZScpID8gdGhpcy5lZGl0VGVtcGxhdGUgOiB0aGlzLnRlbXBsYXRlO1xuICAgICAgICB2YXIgdm0gPSBfLmV4dGVuZCh7XG4gICAgICAgICAgICByb2xlczogdGhpcy5wcm9qZWN0LmdldCgncm9sZXMnKSxcbiAgICAgICAgICAgIG9wdGlvbmFsUm9sZXM6IHRoaXMucHJvamVjdC5nZXQoJ29wdGlvbmFsUm9sZXMnKSxcbiAgICAgICAgICAgIHdvcmxkczogdGhpcy53b3JsZHMuZ2V0V29ybGROYW1lcygpLFxuICAgICAgICAgICAgbmV3V29ybGQ6IHRoaXMud29ybGRzLmdldE5leHRXb3JsZE5hbWUoKVxuICAgICAgICB9LCB0aGlzLm1vZGVsLnRvSlNPTigpKTtcblxuICAgICAgICB0aGlzLiRlbC5odG1sKHRlbXBsKHZtKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHVwZGF0ZURhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdGhpcy4kKCdbZGF0YS1maWVsZF0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlbCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgZmllbGQgPSBlbC5kYXRhKCdmaWVsZCcpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IGVsLnZhbCgpO1xuXG4gICAgICAgICAgICBtZS5tb2RlbC5zZXQoZmllbGQsIHZhbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzaWdubWVudFJvdzsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBVc2Vyc0NvbGxlY3Rpb24gPSByZXF1aXJlKCcuL3VzZXJzLWNvbGxlY3Rpb24nKTtcbnZhciBXb3JsZHNDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi93b3JsZHMtY29sbGVjdGlvbicpO1xudmFyIFByb2plY3RNb2RlbCA9IHJlcXVpcmUoJy4vcHJvamVjdC1tb2RlbCcpO1xudmFyIEFzc2lnbmVtbnRSb3cgPSByZXF1aXJlKCcuL2Fzc2lnbm1lbnQtcm93Jyk7XG52YXIgZW52ID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpO1xudmFyIEFqYXhRdWV1ZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvYWpheC1xdWV1ZScpO1xuXG5mdW5jdGlvbiBzZXRFbnZpcm9ubWVudChvcHRpb25zKSB7XG4gICAgZW52LnNldChfLm9taXQob3B0aW9ucywgJ2VsJykpO1xufVxuXG52YXIgQXNzaWdubWVudCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgc2V0RW52aXJvbm1lbnQob3B0aW9ucyk7XG4gICAgdGhpcy5pbml0aWFsaXplKG9wdGlvbnMpO1xufTtcblxuQXNzaWdubWVudC5wcm90b3R5cGUgPSB7XG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLmVsID0gdHlwZW9mIG9wdGlvbnMuZWwgPT09ICdzdHJpbmcnID8gJChvcHRpb25zLmVsKVswXSA6IG9wdGlvbnMuZWw7XG4gICAgICAgIHRoaXMuJGVsID0gJCh0aGlzLmVsKTtcbiAgICAgICAgdGhpcy4kID0gXy5wYXJ0aWFsUmlnaHQoJCwgdGhpcy5lbCk7XG5cbiAgICAgICAgdGhpcy51c2VycyA9IG5ldyBVc2Vyc0NvbGxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy53b3JsZHMgPSBuZXcgV29ybGRzQ29sbGVjdGlvbigpO1xuICAgICAgICB0aGlzLnByb2plY3QgPSBuZXcgUHJvamVjdE1vZGVsKCk7XG5cbiAgICAgICAgXy5iaW5kQWxsKHRoaXMsIFsncmVuZGVyJywgJ3JlbmRlclRhYmxlJywgJ3RvZ2dsZUNvbnRyb2xscycsICdzYXZlRWRpdCcsICdzZWxlY3RBbGwnLCAndXNhc3NpZ25TZWxlY3RlZCcsICdfc2hvd1VwZGF0aW5nJywgJ19oaWRlVXBkYXRpbmcnLCAnYXV0b0Fzc2lnbkFsbCcsICdtYWtlVXNlckluYWN0aXZlJ10pO1xuXG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLm9uKCd1cGRhdGUnLCAndHInLCB0aGlzLnNhdmVFZGl0KTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJ2lucHV0OmNoZWNrYm94Om5vdCgjc2VsZWN0LWFsbCknLCB0aGlzLnRvZ2dsZUNvbnRyb2xscyk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcjc2VsZWN0LWFsbCcsIHRoaXMuc2VsZWN0QWxsKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy51bmFzc2lnbi11c2VyJywgdGhpcy51c2Fzc2lnblNlbGVjdGVkKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy5hdXRvLWFzc2lnbi1hbGwnLCB0aGlzLmF1dG9Bc3NpZ25BbGwpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLm1ha2UtdXNlci1pbmFjdGl2ZScsIHRoaXMubWFrZVVzZXJJbmFjdGl2ZSk7XG4gICAgfSxcblxuICAgIGxvYWQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgam9pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMud29ybGRzLnNldFVzZXJzQ29sbGVjdGlvbih0aGlzLnVzZXJzKTtcbiAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiAkLndoZW4oXG4gICAgICAgICAgICB0aGlzLndvcmxkcy5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy51c2Vycy5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0LmZldGNoKClcbiAgICAgICAgKS50aGVuKGpvaW4pO1xuXG4gICAgfSxcblxuICAgIHNhdmVFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMud29ybGRzLmZldGNoKClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkcy5qb2luVXNlcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udHJvbHMoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIGF1dG9Bc3NpZ25BbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fc2hvd1VwZGF0aW5nKCk7XG4gICAgICAgIHZhciBtYXhVc2VycyA9ICt0aGlzLiQoJyNtYXgtdXNlcnMnKS52YWwoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRzLmF1dG9Bc3NpZ25BbGwoeyBtYXhVc2VyczogbWF4VXNlcnMgfSlcbiAgICAgICAgICAgIC50aGVuKHRoaXMuX2hpZGVVcGRhdGluZylcbiAgICAgICAgICAgIC5mYWlsKHRoaXMuX2hpZGVVcGRhdGluZylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkcy5qb2luVXNlcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0U2VsZWN0ZWRJZHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJCgndGJvZHkgOmNoZWNrYm94OmNoZWNrZWQnKS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgnaWQnKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGZpbmRSb3dWaWV3czogZnVuY3Rpb24gKGlkcykge1xuICAgICAgICByZXR1cm4gXy5tYXAoaWRzLCBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvd1ZpZXdzW2lkXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIHVuYXNzaWduVXNlcnM6IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkdGQucmVzb2x2ZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZvciBub3cgd2UgbmVlZCB0byBzZXF1ZW5jZSB0aGUgY2FsbHMgdG8gdW5hc3NpZ24gdXNlcnMgZnJvbSB3b3JsZHNcbiAgICAgICAgdmFyIHF1ZXVlID0gbmV3IEFqYXhRdWV1ZSgpO1xuXG4gICAgICAgIF8uZWFjaChpZHMsIGZ1bmN0aW9uICh1c2VySWQpIHtcbiAgICAgICAgICAgIHZhciB1c2VyID0gdGhpcy51c2Vycy5nZXRCeUlkKHVzZXJJZCk7XG4gICAgICAgICAgICB1c2VyLnNldCgnd29ybGQnLCAnJyk7XG4gICAgICAgICAgICB1c2VyLnNldCgncm9sZScsICcnKTtcbiAgICAgICAgICAgIHF1ZXVlLmFkZChfLnBhcnRpYWwoXy5iaW5kKHRoaXMud29ybGRzLnVwZGF0ZVVzZXIsIHRoaXMud29ybGRzKSwgdXNlcikpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBxdWV1ZS5leGVjdXRlKHRoaXMpLnRoZW4oZG9uZSk7XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIHVzYXNzaWduU2VsZWN0ZWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgaWRzID0gdGhpcy5nZXRTZWxlY3RlZElkcygpO1xuXG4gICAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53b3JsZHMuZmV0Y2goKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkcy5qb2luVXNlcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlVXBkYXRpbmcoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdGhpcy5fc2hvd1VwZGF0aW5nKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudW5hc3NpZ25Vc2VycyhpZHMpLnRoZW4oZG9uZSk7XG4gICAgfSxcblxuICAgIG1ha2VVc2VySW5hY3RpdmU6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGlkcyA9IHRoaXMuZ2V0U2VsZWN0ZWRJZHMoKTtcbiAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUNvbnRyb2xscygpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdmFyIG1ha2VVc2Vyc0luYWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJvd3MgPSB0aGlzLmZpbmRSb3dWaWV3cyhpZHMpO1xuICAgICAgICAgICAgLy8gZm9yIG5vdyB3ZSBuZWVkIHRvIHNlcXVlbmNlIHRoZSBjYWxscyB0byBwYXRjaCB0aGUgdXNlcnNcbiAgICAgICAgICAgIC8vIHNpbmNlIHRoZSBBUEkgY2FuIG9ubHkgb3BlcmF0ZSBvbiBvbmUgY2FsbCBwZXIgZ3JvdXAgYXQgYSB0aW1lXG4gICAgICAgICAgICB2YXIgcXVldWUgPSBuZXcgQWpheFF1ZXVlKCk7XG4gICAgICAgICAgICBfLmVhY2gocm93cywgZnVuY3Rpb24gKHZpZXcpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXNlciA9IHZpZXcubW9kZWw7XG4gICAgICAgICAgICAgICAgcXVldWUuYWRkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpZXcubWFrZUluYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgIHF1ZXVlLmV4ZWN1dGUodGhpcykudGhlbihkb25lKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnVuYXNzaWduVXNlcnMoaWRzKVxuICAgICAgICAgICAgLnRoZW4obWFrZVVzZXJzSW5hY3RpdmUpO1xuXG5cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJCgndGFibGUgdGJvZHknKS5lbXB0eSgpO1xuICAgICAgICB0aGlzLnJlbmRlclRhYmxlKCk7XG4gICAgICAgIHRoaXMudG9nZ2xlQ29udHJvbGxzKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucm93Vmlld3MgPSB7fTtcbiAgICAgICAgdmFyIHJvd3MgPSBbXTtcbiAgICAgICAgdGhpcy51c2Vycy5lYWNoKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICB2YXIgdmlldyA9IG5ldyBBc3NpZ25lbW50Um93KHsgbW9kZWw6IHUsIHdvcmxkczogdGhpcy53b3JsZHMsIHByb2plY3Q6IHRoaXMucHJvamVjdCB9KTtcbiAgICAgICAgICAgIHRoaXMucm93Vmlld3NbdS5nZXQoJ2lkJyldID0gdmlldztcbiAgICAgICAgICAgIHJvd3MucHVzaCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy4kKCd0YWJsZSB0Ym9keScpLmFwcGVuZChyb3dzKTtcbiAgICB9LFxuXG5cbiAgICB1cGRhdGVDb250cm9sczogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xzRm9yU2VsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMudXBkYXRlQXV0b0Fzc2lnbkJ1dHRvbigpO1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1cygpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0dXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluY29tcGxldGVXb3JsZHMgPSB0aGlzLndvcmxkcy5nZXRJbmNvbXBsZXRlV29ybGRzQ291bnQoKTtcbiAgICAgICAgdmFyIHVuYXNzaWduZWRVc2VycyA9IHRoaXMudXNlcnMuZ2V0VW5hc3NpZ25lZFVzZXJzQ291bnQoKTtcbiAgICAgICAgdmFyIHRvdGFsV29ybGRzID0gdGhpcy53b3JsZHMuc2l6ZSgpO1xuXG4gICAgICAgIHZhciB1c2Vyc1RleHQgPSAnQWxsIHVzZXJzIGhhdmUgYmVlbiBhc3NpZ25lZC4nO1xuICAgICAgICBpZiAodW5hc3NpZ25lZFVzZXJzKSB7XG4gICAgICAgICAgICB1c2Vyc1RleHQgPSB1bmFzc2lnbmVkVXNlcnMgPT09IDEgPyAnMSB1c2VyIG5lZWRzIGFzc2lnbm1lbnQuJyA6IHVuYXNzaWduZWRVc2VycyArICcgdXNlcnMgbmVlZCBhc3NpZ25tZW50Lic7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHdvcmxkc1RleHQgPSAnQWxsIHdvcmxkcyBhcmUgY29tcGxldGUuJztcbiAgICAgICAgaWYgKCF0b3RhbFdvcmxkcykge1xuICAgICAgICAgICAgd29ybGRzVGV4dCA9ICdObyB3b3JsZHMgaGF2ZSBiZWVuIGNyZWF0ZWQuJztcbiAgICAgICAgfSBlbHNlIGlmIChpbmNvbXBsZXRlV29ybGRzKSB7XG4gICAgICAgICAgICB3b3JsZHNUZXh0ID0gaW5jb21wbGV0ZVdvcmxkcyA9PT0gMSA/ICcxIGluY29tcGxldGUgd29ybGQgbmVlZHMgYXR0ZW50aW9uLicgOiBpbmNvbXBsZXRlV29ybGRzICsgJyBpbmNvbXBsZXRlIHdvcmxkcyBuZWVkIGF0dGVudGlvbi4nO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kKCcjdXNlcnMtc3RhdHVzIC50ZXh0JykudGV4dCh1c2Vyc1RleHQpO1xuICAgICAgICB0aGlzLiQoJyN3b3JsZHMtc3RhdHVzIC50ZXh0JykudGV4dCh3b3JsZHNUZXh0KTtcblxuICAgICAgICBpZiAodW5hc3NpZ25lZFVzZXJzKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyN1c2Vycy1zdGF0dXMnKS5hZGRDbGFzcygnaW5jb21wbGV0ZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcjdXNlcnMtc3RhdHVzJykucmVtb3ZlQ2xhc3MoJ2luY29tcGxldGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmNvbXBsZXRlV29ybGRzIHx8ICF0b3RhbFdvcmxkcykge1xuICAgICAgICAgICAgdGhpcy4kKCcjd29ybGRzLXN0YXR1cycpLmFkZENsYXNzKCdpbmNvbXBsZXRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJyN3b3JsZHMtc3RhdHVzJykucmVtb3ZlQ2xhc3MoJ2luY29tcGxldGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJCgnLnN0YXR1cy13aWRnZXQnKS5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDb250cm9sc0ZvclNlbGVjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbnVtU2VsZWN0ZWQgPSB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveDpjaGVja2VkJykubGVuZ3RoO1xuICAgICAgICB0aGlzLiQoJy5jb21wb25lbnQuY29udHJvbHMnKVtudW1TZWxlY3RlZCA/ICdhZGRDbGFzcycgOiAncmVtb3ZlQ2xhc3MnXSgndmlzaWJsZScpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVBdXRvQXNzaWduQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvamVjdC5pc0R5bmFtaWNBc3NpZ25tZW50KCkpIHtcbiAgICAgICAgICAgIHZhciBoYXNSb2xlcyA9IHRoaXMucHJvamVjdC5oYXNSb2xlcygpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLnNpbmdsZScpLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5keW5hbWljJykuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLmR5bmFtaWMtbm8tcm9sZXMtdGV4dCcpW2hhc1JvbGVzID8gJ2hpZGUnIDogJ3Nob3cnXSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLm5vLXJvbGVzJylbaGFzUm9sZXMgPyAnaGlkZScgOiAnc2hvdyddKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuZHluYW1pYycpLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5keW5hbWljLW5vLXJvbGVzLXRleHQnKS5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuc2luZ2xlJykuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLm5vLXJvbGVzJykuc2hvdygpO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2Vycy5hbGxVc2Vyc0Fzc2lnbmVkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzJykucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzJykuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZWxlY3RBbGw6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMuJCgndGJvZHkgOmNoZWNrYm94JykucHJvcCgnY2hlY2tlZCcsIGUudGFyZ2V0LmNoZWNrZWQpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xzKCk7XG4gICAgfSxcblxuICAgIHRvZ2dsZUNvbnRyb2xsczogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHRvdGFsID0gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3gnKTtcbiAgICAgICAgdmFyIGNoZWNrZWQgPSB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveDpjaGVja2VkJyk7XG5cbiAgICAgICAgaWYgKHRvdGFsLmxlbmd0aCA9PT0gY2hlY2tlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3NlbGVjdC1hbGwnKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3NlbGVjdC1hbGwnKS5yZW1vdmVBdHRyKCdjaGVja2VkJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xzKCk7XG4gICAgfSxcblxuICAgIF9zaG93VXBkYXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwuY3NzKHsgb3BhY2l0eTogMC40IH0pO1xuICAgIH0sXG5cbiAgICBfaGlkZVVwZGF0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLmNzcyh7IG9wYWNpdHk6IDEgfSk7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc2lnbm1lbnQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQmFzZUNvbGxlY3Rpb24gPSBmdW5jdGlvbiAobW9kZWxzLCBvcHRpb25zKSB7XG4gICAgdGhpcy5fbW9kZWxzID0gW107XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbl8uZXh0ZW5kKEJhc2VDb2xsZWN0aW9uLnByb3RvdHlwZSwge1xuICAgIGlkQXR0cmlidXRlOiAnaWQnLFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xuICAgIH0sXG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChhdHRyLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBtID0gbmV3IHRoaXMubW9kZWwoYXR0ciwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuc2V0KG0pO1xuICAgICAgICByZXR1cm4gbTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fbW9kZWxzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuc2V0KG1vZGVscyk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgIF8ucmVtb3ZlKHRoaXMuX21vZGVscywgZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiBtID09PSBtb2RlbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVsZXRlIG1vZGVsLmNvbGxlY3Rpb247XG5cbiAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uIChtb2RlbHMpIHtcbiAgICAgICAgaWYgKCFtb2RlbHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vZGVscyA9IFtdLmNvbmNhdChtb2RlbHMpO1xuXG4gICAgICAgIGlmICghbW9kZWxzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgXy5lYWNoKG1vZGVscywgZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghKG0gaW5zdGFuY2VvZiB0aGlzLm1vZGVsKSkge1xuICAgICAgICAgICAgICAgIG0gPSBuZXcgdGhpcy5tb2RlbChtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbS5jb2xsZWN0aW9uID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5fbW9kZWxzLnB1c2gobSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuc29ydCgpO1xuXG4gICAgICAgIHJldHVybiBtb2RlbHM7XG4gICAgfSxcblxuICAgIHNvcnRGbjogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIuX2RhdGFbdGhpcy5pZEF0dHJpYnV0ZV0gLSBhLl9kYXRhW3RoaXMuaWRBdHRyaWJ1dGVdO1xuICAgIH0sXG5cbiAgICBzb3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX21vZGVscyA9IHRoaXMuX21vZGVscy5zb3J0KHRoaXMuc29ydEZuLmJpbmQodGhpcykpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9tb2RlbHM7XG4gICAgfSxcblxuICAgIGdldEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4gXy5maW5kKHRoaXMuX21vZGVscywgZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiBtLmdldCh0aGlzLmlkQXR0cmlidXRlKSA9PT0gaWQ7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICBlYWNoOiBmdW5jdGlvbiAoY2IsIGN0eCkge1xuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMuX21vZGVscywgY2IsIGN0eCB8fCB0aGlzKTtcbiAgICB9LFxuXG4gICAgYWxsOiBmdW5jdGlvbiAoY2IsIGN0eCkge1xuICAgICAgICByZXR1cm4gXy5hbGwodGhpcy5fbW9kZWxzLCBjYiwgY3R4IHx8IHRoaXMpO1xuICAgIH0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF8uaW52b2tlKHRoaXMuX21vZGVscywgJ3RvSlNPTicpO1xuICAgIH0sXG5cbiAgICBmaW5kOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgcmV0dXJuIF8uZmluZCh0aGlzLl9tb2RlbHMsIGZuKTtcbiAgICB9LFxuXG4gICAgZmlsdGVyOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHRoaXMuX21vZGVscywgZm4pO1xuICAgIH0sXG5cbiAgICBzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tb2RlbHMubGVuZ3RoO1xuICAgIH0sXG5cbiAgICBtYXA6IGZ1bmN0aW9uIChmbiwgY3R4KSB7XG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLl9tb2RlbHMsIGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwoY3R4LCBtb2RlbC50b0pTT04oKSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBwbHVjazogZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIG1bZmllbGRdO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VDb2xsZWN0aW9uOyIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgQmFzZU1vZGVsID0gZnVuY3Rpb24gKGF0dHIsIG9wdGlvbnMpIHtcbiAgICBhdHRyID0gXy5kZWZhdWx0cyh7fSwgYXR0ciwgXy5yZXN1bHQodGhpcywgJ2RlZmF1bHRzJykpO1xuICAgIHRoaXMuX2RhdGEgPSB7fTtcbiAgICB0aGlzLnNldChhdHRyLCBvcHRpb25zKTtcbiAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbl8uZXh0ZW5kKEJhc2VNb2RlbC5wcm90b3R5cGUsIHtcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0ciwgb3B0aW9ucykge1xuXG4gICAgfSxcblxuICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsLCBvcHRpb25zKSB7XG4gICAgICAgIGlmIChrZXkgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGF0dHJzO1xuICAgICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIGF0dHJzID0ga2V5O1xuICAgICAgICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsO1xuICAgICAgICB9XG5cbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG5cbiAgICAgICAgXy5leHRlbmQodGhpcy5fZGF0YSwgYXR0cnMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uIChrZXksIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGFba2V5XTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmNvbGxlY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMuY29sbGVjdGlvbi5yZW1vdmUodGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhO1xuICAgIH0sXG5cbiAgICBwaWNrOiBmdW5jdGlvbiAoa2V5cykge1xuICAgICAgICByZXR1cm4gXy5waWNrKHRoaXMuX2RhdGEsIGtleXMpO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZU1vZGVsOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGVudiA9IHtcbiAgICBhY2NvdW50OiAnJyxcbiAgICBwcm9qZWN0OiAnJyxcbiAgICBncm91cDogJycsXG4gICAgZ3JvdXBJZDogJycsXG4gICAgdG9rZW46ICcnLFxuICAgIHNlcnZlcjoge1xuICAgICAgICBob3N0OiAnYXBpLmZvcmlvLmNvbScsXG4gICAgICAgIHByb3RvY29sOiAnaHR0cHMnXG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2V0OiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICBlbnYgPSBfLm1lcmdlKGVudiwgb3B0aW9ucyk7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gZW52O1xuICAgIH1cbn07IiwiKGZ1bmN0aW9uICgpIHtcbiAgICAndXNlIHN0cmljdCc7XG4gICAgdmFyIEFwcCA9IHJlcXVpcmUoJy4vYXNzaWdubWVudC5qcycpO1xuXG4gICAgd2luZG93LmZvcmlvID0gd2luZG93LmZvcmlvIHx8IHt9O1xuICAgIHdpbmRvdy5mb3Jpby5NdWx0aXBsYXllckFzc2lnbm1lbnRDb21wb25lbnQgPSBBcHA7XG59KCkpO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1tb2RlbCcpO1xuLy8gdmFyIF9fc3VwZXIgPSBCYXNlLnByb3RvdHlwZTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuXG4gICAgaXNEeW5hbWljQXNzaWdubWVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5nZXQoJ3dvcmxkcycpID09PSAnZHluYW1pYyc7XG4gICAgfSxcblxuICAgIGhhc1JvbGVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciByb2xlcyA9IHRoaXMuZ2V0KCdyb2xlcycpO1xuICAgICAgICByZXR1cm4gcm9sZXMgJiYgISFyb2xlcy5sZW5ndGg7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBhcGkgPSBzZXJ2aWNlTG9jYXRvci53b3JsZEFwaSgpO1xuXG4gICAgICAgIHJldHVybiBhcGkuZ2V0UHJvamVjdFNldHRpbmdzKCkudGhlbihmdW5jdGlvbiAoc2V0dGluZ3MpIHtcbiAgICAgICAgICAgIHRoaXMuc2V0KHNldHRpbmdzKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBlbnYgPSByZXF1aXJlKCcuL2RlZmF1bHRzLmpzJyk7XG5cbnZhciBjYWNoZSA9IHt9O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICB3b3JsZEFwaTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNhY2hlLndvcmxkQXBpKSB7XG4gICAgICAgICAgICBjYWNoZS53b3JsZEFwaSA9IG5ldyBGLnNlcnZpY2UuV29ybGQoZW52LmdldCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWNoZS53b3JsZEFwaTtcbiAgICB9LFxuXG4gICAgbWVtYmVyQXBpOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY2FjaGUubWVtYmVyQXBpKSB7XG4gICAgICAgICAgICBjYWNoZS5tZW1iZXJBcGkgPSBuZXcgRi5zZXJ2aWNlLk1lbWJlcihfLnBpY2soZW52LmdldCgpLCBbJ2dyb3VwSWQnLCAnc2VydmVyJ10pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWNoZS5tZW1iZXJBcGk7XG4gICAgfSxcblxuICAgIHVzZXJBcGk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjYWNoZS51c2VyQXBpKSB7XG4gICAgICAgICAgICBjYWNoZS51c2VyQXBpID0gbmV3IEYuc2VydmljZS5Vc2VyKF8ucGljayhlbnYuZ2V0KCksIFsnYWNjb3VudCcsICdzZXJ2ZXInXSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhY2hlLnVzZXJBcGk7XG4gICAgfVxufTsiLCJleHBvcnRzW1wiZWRpdC11c2VyLXJvd1wiXSA9IGZ1bmN0aW9uKG9iaikge1xub2JqIHx8IChvYmogPSB7fSk7XG52YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGUsIF9faiA9IEFycmF5LnByb3RvdHlwZS5qb2luO1xuZnVuY3Rpb24gcHJpbnQoKSB7IF9fcCArPSBfX2ouY2FsbChhcmd1bWVudHMsICcnKSB9XG53aXRoIChvYmopIHtcbl9fcCArPSAnPHRkPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cInNlbGVjdFwiIGRhdGEtaWQ9XCInICtcbigoX190ID0gKCBpZCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIjwvdGQ+XFxuPHRkPjwvdGQ+XFxuPHRkPlxcbiAgICA8c2VsZWN0IG5hbWU9XCJ3b3JsZHNcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtZmllbGQ9XCJ3b3JsZFwiPlxcblxcbiAgICAnO1xuIF8uZWFjaCh3b3JsZHMsIGZ1bmN0aW9uICh3KSB7IDtcbl9fcCArPSAnXFxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiJyArXG4oKF9fdCA9ICggdyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIiAnICtcbigoX190ID0gKCB3ID09PSB3b3JsZCA/ICdzZWxlY3RlZCcgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic+JyArXG4oKF9fdCA9ICggdyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L29wdGlvbj5cXG4gICAgJztcbiB9KTsgO1xuX19wICs9ICdcXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCInICtcbigoX190ID0gKCBuZXdXb3JsZCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIiBjbGFzcz1cIm5ldy13b3JsZC10ZXh0XCI+PGk+JyArXG4oKF9fdCA9ICggbmV3V29ybGQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nIC0gTmV3IC08L2k+PC9vcHRpb24+XFxuICAgIDwvc2VsZWN0PlxcbjwvdGQ+XFxuPHRkPlxcbiAgICA8c2VsZWN0IG5hbWU9XCJyb2xlc1wiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgZGF0YS1maWVsZD1cInJvbGVcIj5cXG4gICAgJztcbiBfLmVhY2gocm9sZXMsIGZ1bmN0aW9uIChyKSB7IDtcbl9fcCArPSAnXFxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiJyArXG4oKF9fdCA9ICggciApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIiAnICtcbigoX190ID0gKCByID09PSByb2xlID8gJ3NlbGVjdGVkJyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJz4nICtcbigoX190ID0gKCByICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvb3B0aW9uPlxcbiAgICAnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcblxcbiAgICAnO1xuIF8uZWFjaChvcHRpb25hbFJvbGVzLCBmdW5jdGlvbiAocikgeyA7XG5fX3AgKz0gJ1xcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIicgK1xuKChfX3QgPSAoIHIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCIgJyArXG4oKF9fdCA9ICggciA9PT0gcm9sZSA/ICdzZWxlY3RlZCcgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic+JyArXG4oKF9fdCA9ICggciApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgPGk+KE9wdGlvbmFsKTwvaT48L29wdGlvbj5cXG4gICAgJztcbiB9KTsgO1xuX19wICs9ICdcXG4gICAgPC9zZWxlY3Q+XFxuPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggbGFzdE5hbWUgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggdXNlck5hbWUgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggIXdvcmxkID8gJzxlbSBjbGFzcz1cImYtaWNvbiBmLXdhcm5pbmdcIj48L2VtPicgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZCBjbGFzcz1cImFjdGlvbnNcIj5cXG4gICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tcHJpbWFyeSBidG4tdG9vbHMgYnRuLXNhdmUgc2F2ZVwiPlNhdmU8L2J1dHRvbj5cXG4gICAgPGJ1dHRvbiBjbGFzcz1cImJ0biBidG4tdG9vbHMgYnRuLWNhbmNlbCBjYW5jZWxcIj5DYW5jZWw8L2J1dHRvbj5cXG48L3RkPic7XG5cbn1cbnJldHVybiBfX3Bcbn07XG5leHBvcnRzW1widXNlci1yb3dcIl0gPSBmdW5jdGlvbihvYmopIHtcbm9iaiB8fCAob2JqID0ge30pO1xudmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlO1xud2l0aCAob2JqKSB7XG5fX3AgKz0gJzx0ZD48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2xhc3M9XCJzZWxlY3RcIiBkYXRhLWlkPVwiJyArXG4oKF9fdCA9ICggaWQpKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIjwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoICFpc1dvcmxkQ29tcGxldGUgPyAnPGVtIGNsYXNzPVwiZi1pY29uIGYtd2FybmluZ1wiPjwvZW0+JyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIHdvcmxkICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIHJvbGUgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggbGFzdE5hbWUgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggdXNlck5hbWUgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggIXdvcmxkID8gJzxlbSBjbGFzcz1cImYtaWNvbiBmLXdhcm5pbmdcIj48L2VtPicgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZCBjbGFzcz1cImFjdGlvbnNcIj48YnV0dG9uIGNsYXNzPVwiYnRuIGVkaXQgYnRuLWVkaXQgYnRuLXRvb2xzIGF1dG8taGlkZVwiPkVkaXQ8L2J1dHRvbj48L3RkPic7XG5cbn1cbnJldHVybiBfX3Bcbn07IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1tb2RlbCcpO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgd29ybGQ6ICcnLFxuICAgICAgICByb2xlOiAnJyxcbiAgICAgICAgYWN0aXZlOiB0cnVlLFxuICAgICAgICBpc1dvcmxkQ29tcGxldGU6IHRydWUsXG4gICAgICAgIGZpcnN0TmFtZTogJycsXG4gICAgICAgIGxhc3ROYW1lOiAnJ1xuICAgIH0sXG5cbiAgICBtYWtlQWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZW1iZXJBcGkgPSBzZXJ2aWNlTG9jYXRvci5tZW1iZXJBcGkoKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgICAgIHVzZXJJZDogdGhpcy5nZXQoJ2lkJyksXG4gICAgICAgICAgICBncm91cElkOiB0aGlzLmdldCgnZ3JvdXBJZCcpXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG9yaWdpbmFsID0gdGhpcy5nZXQoJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLnNldCgnYWN0aXZlJywgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIG1lbWJlckFwaS5tYWtlVXNlckFjdGl2ZShwYXJhbXMpXG4gICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gcmV2ZXJ0IHRoZSBjaGFuZ2VcbiAgICAgICAgICAgICAgICB0aGlzLnNldCgnYWN0aXZlJywgb3JpZ2luYWwpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgbWFrZUluYWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZW1iZXJBcGkgPSBzZXJ2aWNlTG9jYXRvci5tZW1iZXJBcGkoKTtcbiAgICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgICAgIHVzZXJJZDogdGhpcy5nZXQoJ2lkJyksXG4gICAgICAgICAgICBncm91cElkOiB0aGlzLmdldCgnZ3JvdXBJZCcpXG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIG9yaWdpbmFsID0gdGhpcy5nZXQoJ2FjdGl2ZScpO1xuICAgICAgICB0aGlzLnNldCgnYWN0aXZlJywgZmFsc2UpO1xuXG4gICAgICAgIHJldHVybiBtZW1iZXJBcGkubWFrZVVzZXJJbmFjdGl2ZShwYXJhbXMpXG4gICAgICAgICAgICAuZmFpbChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgLy8gcmV2ZXJ0IHRoZSBjaGFuZ2VcbiAgICAgICAgICAgICAgICB0aGlzLnNldCgnYWN0aXZlJywgb3JpZ2luYWwpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG5cbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vdXNlci1tb2RlbCcpO1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtY29sbGVjdGlvbicpO1xudmFyIGVudiA9IHJlcXVpcmUoJy4vZGVmYXVsdHMnKTtcbnZhciBzZXJ2aWNlTG9jYXRvciA9IHJlcXVpcmUoJy4vc2VydmljZS1sb2NhdG9yJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIG1vZGVsOiBNb2RlbCxcblxuICAgIHNvcnRGbjogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgdmFyIGF3ID0gYS5nZXQoJ3dvcmxkJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgdmFyIGJ3ID0gYi5nZXQoJ3dvcmxkJykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKGF3ICE9PSBidykge1xuICAgICAgICAgICAgcmV0dXJuIGF3IDwgYncgPyAtMSA6IDE7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYi5nZXQoJ3VzZXJOYW1lJykgPiBhLmdldCgndXNlck5hbWUnKSA/IC0xIDogMTtcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgQXV0aG9yaXphdGlvbjogJ0JlYXJlciAnICsgZW52LmdldCgpLnRva2VuXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBhbGxVc2Vyc0Fzc2lnbmVkOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmFsbChmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgcmV0dXJuICEhdS5nZXQoJ3dvcmxkJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRVbmFzc2lnbmVkVXNlcnNDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiAhdS5nZXQoJ3dvcmxkJyk7XG4gICAgICAgIH0pLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIGdyb3VwSWQgPSBlbnYuZ2V0KCkuZ3JvdXBJZDtcblxuICAgICAgICB2YXIgZ2V0R3JvdXBVc2VycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBtZW1iZXJBcGkgPSBzZXJ2aWNlTG9jYXRvci5tZW1iZXJBcGkoKTtcbiAgICAgICAgICAgIHZhciB1c2VyQXBpID0gc2VydmljZUxvY2F0b3IudXNlckFwaSgpO1xuXG4gICAgICAgICAgICB2YXIgbG9hZEdyb3VwTWVtYmVycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWVtYmVyQXBpLmdldEdyb3VwRGV0YWlscygpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgdmFyIGxvYWRVc2Vyc0luZm8gPSBmdW5jdGlvbiAoZ3JvdXApIHtcbiAgICAgICAgICAgICAgICB2YXIgbm9uRmFjQW5kQWN0aXZlID0gZnVuY3Rpb24gKHUpIHsgcmV0dXJuIHUuYWN0aXZlICYmIHUucm9sZSAhPT0gJ2ZhY2lsaXRhdG9yJzsgfTtcbiAgICAgICAgICAgICAgICB2YXIgdXNlcnMgPSBfLnBsdWNrKF8uZmlsdGVyKGdyb3VwLm1lbWJlcnMsIG5vbkZhY0FuZEFjdGl2ZSksICd1c2VySWQnKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdXNlckFwaS5nZXQoeyBpZDogdXNlcnMgfSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICByZXR1cm4gbG9hZEdyb3VwTWVtYmVycygpXG4gICAgICAgICAgICAgICAgLnRoZW4obG9hZFVzZXJzSW5mbylcbiAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgfTtcblxuICAgICAgICBnZXRHcm91cFVzZXJzKClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuICAgICAgICAgICAgICAgIHVzZXJzID0gXy5tYXAodXNlcnMsIGZ1bmN0aW9uICh1KSB7IHJldHVybiBfLmV4dGVuZCh1LCB7IGdyb3VwSWQ6IGdyb3VwSWQgfSk7IH0pO1xuICAgICAgICAgICAgICAgIG1lLnNldCh1c2Vycyk7XG4gICAgICAgICAgICAgICAgZHRkLnJlc29sdmUodXNlcnMpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcbnZhciBzZXJ2aWNlTG9jYXRvciA9IHJlcXVpcmUoJy4vc2VydmljZS1sb2NhdG9yJyk7XG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1tb2RlbCcpO1xudmFyIF9fc3VwZXIgPSBCYXNlLnByb3RvdHlwZTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuXG4gICAgZGVmYXVsdHM6IHtcbiAgICAgICAgdXNlcnM6IG51bGwsXG4gICAgICAgIG1vZGVsOiAnbW9kZWwuZXFuJ1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9fc3VwZXIuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXG4gICAgICAgIHRoaXMuX2RhdGEudXNlcnMgPSB0aGlzLl9kYXRhLnVzZXJzIHx8IFtdO1xuXG4gICAgICAgIHRoaXMuX3dvcmxkQXBpID0gc2VydmljZUxvY2F0b3Iud29ybGRBcGkoKTtcblxuICAgICAgICB2YXIgaWQgPSB0aGlzLmdldCgnaWQnKTtcbiAgICAgICAgaWYgKGlkKSB7XG4gICAgICAgICAgICB0aGlzLl93b3JsZEFwaS51cGRhdGVDb25maWcoeyBmaWx0ZXI6IGlkIH0pO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGFkZFVzZXI6IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHZhciB1c2VycyA9IHRoaXMuZ2V0KCd1c2VycycpO1xuICAgICAgICB1c2Vycy5wdXNoKHVzZXIpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnNhdmUoKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlVXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdmFyIGlkID0gdGhpcy5nZXQoJ2lkJyk7XG4gICAgICAgIHZhciBjaGVja1dvcmxkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLmdldCgndXNlcnMnKS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLl93b3JsZEFwaS51cGRhdGVDb25maWcoeyBmaWx0ZXI6IGlkIH0pLmRlbGV0ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgXy5yZW1vdmUodGhpcy5nZXQoJ3VzZXJzJyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICByZXR1cm4gdS5nZXQoJ2lkJykgPT09IHVzZXIuZ2V0KCdpZCcpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fd29ybGRBcGlcbiAgICAgICAgICAgIC51cGRhdGVDb25maWcoeyBmaWx0ZXI6IGlkIH0pXG4gICAgICAgICAgICAucmVtb3ZlVXNlcih7IHVzZXJJZDogdXNlci5nZXQoJ2lkJykgfSlcbiAgICAgICAgICAgIC50aGVuKGNoZWNrV29ybGQpO1xuICAgIH0sXG5cbiAgICBzYXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBtYXBVc2VycyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiBfLm1hcCh0aGlzLmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzID0geyB1c2VySWQ6IHUuZ2V0KCdpZCcpIH07XG4gICAgICAgICAgICAgICAgdmFyIHJvbGUgPSB1LmdldCgncm9sZScpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHJvbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzLnJvbGUgPSByb2xlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiByZXM7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHZhciBjcmVhdGVXb3JsZCA9IF8ucGFydGlhbCh0aGlzLl93b3JsZEFwaS5jcmVhdGUsIHRoaXMucGljayhbJ21vZGVsJywgJ25hbWUnLCAnbWluVXNlcnMnXSkpO1xuICAgICAgICB2YXIgYWRkVXNlcnMgPSBfLnBhcnRpYWwobWUuX3dvcmxkQXBpLmFkZFVzZXJzLCBtYXBVc2VycygpLCB7IGZpbHRlcjogbWUuZ2V0KCdpZCcpIH0pO1xuICAgICAgICB2YXIgc2F2ZWRVc2VycyA9IHRoaXMuZ2V0KCd1c2VycycpO1xuICAgICAgICBpZiAodGhpcy5pc05ldygpKSB7XG4gICAgICAgICAgICAvLyB3ZSBuZWVkIHRvIGNyZWF0ZSB0aGUgd29ybGQgaW4gdGhlIEFQSSBhbmQgdGhlbiBhZGQgdGhlIHVzZXJzXG4gICAgICAgICAgICByZXR1cm4gY3JlYXRlV29ybGQoKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAgICAgICAgICAgICBtZS5zZXQod29ybGQpO1xuICAgICAgICAgICAgICAgICAgICBtZS5fd29ybGRBcGkudXBkYXRlQ29uZmlnKHsgZmlsdGVyOiB3b3JsZC5pZCB9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGFkZFVzZXJzKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh1c2Vycykge1xuICAgICAgICAgICAgICAgICAgICAvLyBzaW5jZSB3ZSByZS1zZXQgdGhlIHdvcmxkLCByZS1zZXQgdGhlIHVzZXJzXG4gICAgICAgICAgICAgICAgICAgIG1lLnNldCgndXNlcnMnLCBzYXZlZFVzZXJzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHRoZSB3b3JsZCBpcyBhbHJlYWR5IGNyZWF0ZWQganVzdCBhZGQgdGhlIHVzZXJzXG4gICAgICAgICAgICByZXR1cm4gYWRkVXNlcnMoKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBpc05ldzogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gIXRoaXMuZ2V0KCdsYXN0TW9kaWZpZWQnKTtcbiAgICB9XG5cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIE1vZGVsID0gcmVxdWlyZSgnLi93b3JsZC1tb2RlbCcpO1xudmFyIFVzZXJNb2RlbCA9IHJlcXVpcmUoJy4vdXNlci1tb2RlbCcpO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcblxudmFyIEJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtY29sbGVjdGlvbicpO1xudmFyIF9fc3VwZXIgPSBCYXNlLnByb3RvdHlwZTtcblxudmFyIGRvbmVGbiA9IGZ1bmN0aW9uIChkdGQsIGFmdGVyKSB7XG4gICAgcmV0dXJuIF8uYWZ0ZXIoYWZ0ZXIsIGR0ZC5yZXNvbHZlKTtcbn07XG5cbnZhciB3b3JsZEFwaTtcblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIG1vZGVsOiBNb2RlbCxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX19zdXBlci5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgICAgIHdvcmxkQXBpID0gc2VydmljZUxvY2F0b3Iud29ybGRBcGkoKTtcbiAgICB9LFxuXG4gICAgYXV0b0Fzc2lnbkFsbDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmF1dG9Bc3NpZ24ob3B0aW9ucylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KHRoaXMucGFyc2Uod29ybGRzKSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBnZXRJbmNvbXBsZXRlV29ybGRzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uICh3KSB7XG4gICAgICAgICAgICByZXR1cm4gIXcuZ2V0KCdjb21wbGV0ZScpO1xuICAgICAgICB9KS5sZW5ndGg7XG4gICAgfSxcblxuICAgIHVwZGF0ZVVzZXI6IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHZhciB3b3JsZE5hbWUgPSB1c2VyLmdldCgnd29ybGQnKTtcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIHByZXZXb3JsZCA9IHRoaXMuZ2V0V29ybGRCeVVzZXIodXNlcik7XG4gICAgICAgIHZhciBjdXJXb3JsZCA9IHRoaXMuZ2V0T3JDcmVhdGVXb3JsZCh3b3JsZE5hbWUpO1xuICAgICAgICB2YXIgZG9uZSA9IGRvbmVGbihkdGQsIDEpO1xuXG4gICAgICAgIC8vIGNoZWNrIGlmIHRoZXJlJ3MgYW55dGhpbmcgdG8gZG9cbiAgICAgICAgaWYgKCFwcmV2V29ybGQgJiYgIWN1cldvcmxkKSB7XG4gICAgICAgICAgICByZXR1cm4gZHRkLnJlc29sdmUoKS5wcm9taXNlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAocHJldldvcmxkKSB7XG4gICAgICAgICAgICBwcmV2V29ybGQucmVtb3ZlVXNlcih1c2VyKVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cldvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gY3VyV29ybGQuYWRkVXNlcih1c2VyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZG9uZSk7XG4gICAgICAgIH0gZWxzZSBpZiAoY3VyV29ybGQpIHtcbiAgICAgICAgICAgIGN1cldvcmxkLmFkZFVzZXIodXNlcilcbiAgICAgICAgICAgICAgICAudGhlbihkb25lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICBnZXRPckNyZWF0ZVdvcmxkOiBmdW5jdGlvbiAod29ybGROYW1lKSB7XG4gICAgICAgIGlmICghd29ybGROYW1lKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgd29ybGQgPSB0aGlzLmdldFdvcmRCeU5hbWUod29ybGROYW1lKTtcblxuICAgICAgICBpZiAoIXdvcmxkKSB7XG4gICAgICAgICAgICB3b3JsZCA9IHRoaXMuY3JlYXRlKHsgbmFtZTogd29ybGROYW1lIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkO1xuICAgIH0sXG5cbiAgICBnZXRXb3JkQnlOYW1lOiBmdW5jdGlvbiAod29ybGROYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICByZXR1cm4gd29ybGQuZ2V0KCduYW1lJykgPT09IHdvcmxkTmFtZTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFdvcmxkQnlVc2VyOiBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICBpZiAoIXVzZXIuZ2V0KSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2dldFdvcmxkQnlVc2VyIGV4cGVjdGVzIGEgbW9kZWwgKCcgKyB1c2VyICsgJyknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBpZCA9IHVzZXIuZ2V0KCdpZCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5nZXRXb3JsZEJ5VXNlcklkKGlkKTtcbiAgICB9LFxuXG4gICAgZ2V0V29ybGRCeVVzZXJJZDogZnVuY3Rpb24gKHVzZXJJZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAgICAgcmV0dXJuIF8uZmluZCh3b3JsZC5nZXQoJ3VzZXJzJyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHUuZ2V0KCdpZCcpID09PSB1c2VySWQ7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFdvcmxkTmFtZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucGx1Y2soJ25hbWUnKS5zb3J0KCk7XG4gICAgfSxcblxuICAgIGdldE5leHRXb3JsZE5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhZCA9IGZ1bmN0aW9uIChudW0sIHBsYWNlcykge1xuICAgICAgICAgICAgdmFyIHplcm9zID0gJzAwMDAwMDAwMDAwMDAwMDAwMCc7XG4gICAgICAgICAgICB2YXIgZGlnaXRzID0gbnVtLnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIG5lZWRlZCA9IHBsYWNlcyAtIGRpZ2l0cztcbiAgICAgICAgICAgIHJldHVybiB6ZXJvcy5zdWJzdHIoMCwgbmVlZGVkKSArIG51bTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgd29ybGRzID0gdGhpcy5nZXRXb3JsZE5hbWVzKCk7XG5cbiAgICAgICAgaWYgKCF3b3JsZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1dvcmxkMDAxJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm9wZXJOYW1lcyA9IF8uZmlsdGVyKHdvcmxkcywgZnVuY3Rpb24gKHcpIHsgcmV0dXJuICgvV29ybGRcXGRcXGRcXGQvKS50ZXN0KHcpOyB9KS5zb3J0KCk7XG4gICAgICAgIHZhciBsYXN0V29ybGQgPSBwcm9wZXJOYW1lc1twcm9wZXJOYW1lcy5sZW5ndGggLSAxXTtcbiAgICAgICAgdmFyIG51bVdvcmxkID0gK2xhc3RXb3JsZC5tYXRjaCgvV29ybGQoXFxkXFxkXFxkKS8pWzFdO1xuICAgICAgICB2YXIgcGxhY2VzVG9QYWQgPSAzO1xuICAgICAgICByZXR1cm4gJ1dvcmxkJyArIHBhZChudW1Xb3JsZCArIDEsIHBsYWNlc1RvUGFkKTtcbiAgICB9LFxuXG4gICAgc2V0VXNlcnNDb2xsZWN0aW9uOiBmdW5jdGlvbiAodXNlcnNDb2xsZWN0aW9uKSB7XG4gICAgICAgIHRoaXMudXNlcnNDb2xsZWN0aW9uID0gdXNlcnNDb2xsZWN0aW9uO1xuICAgIH0sXG5cbiAgICBqb2luVXNlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVzZXJzSGFzaCA9IHt9O1xuICAgICAgICB2YXIgdXNlcnNDb2xsZWN0aW9uID0gdGhpcy51c2Vyc0NvbGxlY3Rpb247XG4gICAgICAgIHVzZXJzQ29sbGVjdGlvbi5lYWNoKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICB1LnNldCh7IGlzV29ybGRDb21wbGV0ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJldHVybiAodXNlcnNIYXNoW3UuZ2V0KCdpZCcpXSA9IHUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24gKHcsIGkpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gdy5nZXQoJ25hbWUnKTtcbiAgICAgICAgICAgIHZhciBpc0NvbXBsZXRlID0gdy5nZXQoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgICB3LnNldCh7IGluZGV4OiBpLCBuYW1lOiBuYW1lIHx8IChpICsgMSkgKyAnJyB9KTtcbiAgICAgICAgICAgIF8uZWFjaCh3LmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICBpZiAodXNlcnNIYXNoW3UuZ2V0KCd1c2VySWQnKV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcnNIYXNoW3UuZ2V0KCd1c2VySWQnKV0uc2V0KHsgd29ybGQ6IG5hbWUsIHJvbGU6IHUuZ2V0KCdyb2xlJyksIGlzV29ybGRDb21wbGV0ZTogaXNDb21wbGV0ZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdXNlcnNDb2xsZWN0aW9uLnNvcnQoKTtcbiAgICB9LFxuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmxpc3QoKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQodGhpcy5wYXJzZSh3b3JsZHMpKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIHBhcnNlOiBmdW5jdGlvbiAod29ybGRzKSB7XG4gICAgICAgIGlmICh3b3JsZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB3b3JsZHMgPSBfLm1hcCh3b3JsZHMsIGZ1bmN0aW9uICh3KSB7XG4gICAgICAgICAgICAgICAgdmFyIHVzZXJzID0gXy5tYXAody51c2VycywgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIHdvcmxkIGFwaSB1c2VycyBJZHMgY29tZXMgYXMgdXNlcklkXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBhZGQgaXQgYXMgaWQgc28gd2UgY2FuIHVzZSB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gc2FtZSBjb2RlIHRvIGFjY2VzcyBtb2RlbHMgdGhhdCBjb21lIGZyb20gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIG1lbWJlci9sb2NhbCBhcGkgYXMgd2l0aCB0aGUgd29ybGQgYXBpXG4gICAgICAgICAgICAgICAgICAgIHUuaWQgPSB1LnVzZXJJZDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVc2VyTW9kZWwodSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB3LnVzZXJzID0gdXNlcnM7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkcztcbiAgICB9XG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxuLyoqXG4qIFV0aWxpdHkgY2xhc3MgdG8gbWFrZSBhamF4IGNhbGxzIHNlcXVlbmNpYWxcbiovXG5mdW5jdGlvbiBBamF4UXVldWUoKSB7XG4gICAgdGhpcy5xdWV1ZSA9IFtdO1xufVxuXG4kLmV4dGVuZChBamF4UXVldWUucHJvdG90eXBlLCB7XG4gICAgYWRkOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucXVldWUucHVzaChmbik7XG4gICAgfSxcblxuICAgIGV4ZWN1dGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IHRoaXM7XG5cbiAgICAgICAgZnVuY3Rpb24gbmV4dCgpIHtcbiAgICAgICAgICAgIGlmIChtZS5xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSBtZS5xdWV1ZS5zaGlmdCgpO1xuXG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb250ZXh0KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihuZXh0KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZHRkLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXhRdWV1ZTsiLCIvKipcbi8qIEluaGVyaXQgZnJvbSBhIGNsYXNzICh1c2luZyBwcm90b3R5cGUgYm9ycm93aW5nKVxuKi9cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaW5oZXJpdChDLCBQKSB7XG4gICAgdmFyIEYgPSBmdW5jdGlvbiAoKSB7fTtcbiAgICBGLnByb3RvdHlwZSA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlID0gbmV3IEYoKTtcbiAgICBDLl9fc3VwZXIgPSBQLnByb3RvdHlwZTtcbiAgICBDLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEM7XG59XG5cbi8qKlxuKiBTaGFsbG93IGNvcHkgb2YgYW4gb2JqZWN0XG4qIEBwYXJhbSB7T2JqZWN0fSBkZXN0IG9iamVjdCB0byBleHRlbmRcbiogQHJldHVybiB7T2JqZWN0fSBleHRlbmRlZCBvYmplY3RcbiovXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3QgLyosIHZhcl9hcmdzKi8pIHtcbiAgICB2YXIgb2JqID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgY3VycmVudDtcbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IG9iai5sZW5ndGg7IGorKykge1xuICAgICAgICBpZiAoIShjdXJyZW50ID0gb2JqW2pdKSkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90IHdyYXAgaW5uZXIgaW4gZGVzdC5oYXNPd25Qcm9wZXJ0eSBvciBiYWQgdGhpbmdzIHdpbGwgaGFwcGVuXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjdXJyZW50KSB7IC8vZXNsaW50LWRpc2FibGUtbGluZVxuICAgICAgICAgICAgZGVzdFtrZXldID0gY3VycmVudFtrZXldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRlc3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChiYXNlLCBwcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgICB2YXIgcGFyZW50ID0gYmFzZTtcbiAgICB2YXIgY2hpbGQ7XG5cbiAgICBjaGlsZCA9IHByb3BzICYmIHByb3BzLmhhc093blByb3BlcnR5KCdjb25zdHJ1Y3RvcicpID8gcHJvcHMuY29uc3RydWN0b3IgOiBmdW5jdGlvbiAoKSB7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcblxuICAgIC8vIGFkZCBzdGF0aWMgcHJvcGVydGllcyB0byB0aGUgY2hpbGQgY29uc3RydWN0b3IgZnVuY3Rpb25cbiAgICBleHRlbmQoY2hpbGQsIHBhcmVudCwgc3RhdGljUHJvcHMpO1xuXG4gICAgLy8gYXNzb2NpYXRlIHByb3RvdHlwZSBjaGFpblxuICAgIGluaGVyaXQoY2hpbGQsIHBhcmVudCk7XG5cbiAgICAvLyBhZGQgaW5zdGFuY2UgcHJvcGVydGllc1xuICAgIGlmIChwcm9wcykge1xuICAgICAgICBleHRlbmQoY2hpbGQucHJvdG90eXBlLCBwcm9wcyk7XG4gICAgfVxuXG4gICAgLy8gZG9uZVxuICAgIHJldHVybiBjaGlsZDtcbn07XG4iXX0=
