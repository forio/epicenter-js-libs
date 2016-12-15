(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Fzc2lnbm1lbnQtcm93LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9hc3NpZ25tZW50LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9iYXNlLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Jhc2UtbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2RlZmF1bHRzLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9pbmRleC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvcHJvamVjdC1tb2RlbC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvc2VydmljZS1sb2NhdG9yLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy90ZW1wbGF0ZXMuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXItbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXJzLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3dvcmxkLW1vZGVsLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy93b3JsZHMtY29sbGVjdGlvbi5qcyIsInNyYy91dGlsL2FqYXgtcXVldWUuanMiLCJzcmMvdXRpbC9pbmhlcml0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcblxudmFyIEFzc2lnbm1lbnRSb3cgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMuJGVsID0gJCgnPHRyPicpO1xuICAgIHRoaXMuZWwgPSB0aGlzLiRlbFswXTtcbiAgICB0aGlzLiQgPSBfLnBhcnRpYWxSaWdodCgkLCB0aGlzLiRlbCk7XG5cbiAgICB0aGlzLm1vZGVsID0gb3B0aW9ucy5tb2RlbDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMud29ybGRzID0gb3B0aW9ucy53b3JsZHM7XG4gICAgdGhpcy5wcm9qZWN0ID0gb3B0aW9ucy5wcm9qZWN0O1xuXG4gICAgXy5iaW5kQWxsKHRoaXMsIFsnc2V0RWRpdE1vZGUnLCAncmVtb3ZlRWRpdE1vZGUnLCAnc2F2ZUVkaXQnLCAnY2FuY2VsRWRpdCcsICd1cGRhdGVEYXRhJ10pO1xuXG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG5cbn07XG5cbl8uZXh0ZW5kKEFzc2lnbm1lbnRSb3cucHJvdG90eXBlLCB7XG5cbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGVzWyd1c2VyLXJvdyddLFxuXG4gICAgZWRpdFRlbXBsYXRlOiB0ZW1wbGF0ZXNbJ2VkaXQtdXNlci1yb3cnXSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJ2J1dHRvbi5lZGl0JywgdGhpcy5zZXRFZGl0TW9kZSk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICdidXR0b24uc2F2ZScsIHRoaXMuc2F2ZUVkaXQpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnYnV0dG9uLmNhbmNlbCcsIHRoaXMuY2FuY2VsRWRpdCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5vZmYoJ2NsaWNrJywgbnVsbCwgbnVsbCk7XG4gICAgICAgIC8vIHRoaXMgb25seSBnaXZlcyBhIGRlbGF5IHRvIHJlbW92ZSB0aGUgdHJcbiAgICAgICAgLy8gYW5pbWF0aW9uIG9mIGhlaWdodCBvZiB0aGUgdHIgZG9lcyBub3Qgd29ya1xuICAgICAgICB0aGlzLiQoJzpjaGVja2JveCcpLmF0dHIoJ2NoZWNrZWQnLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuJGVsXG4gICAgICAgICAgICAuY3NzKHsgb3BhY2l0eTogMC4zIH0pXG4gICAgICAgICAgICAuYW5pbWF0ZSh7IGhlaWdodDogMCB9LCB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBtYWtlSW5hY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwubWFrZUluYWN0aXZlKCk7XG4gICAgfSxcblxuICAgIHNldEVkaXRNb2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KCdlZGl0LW1vZGUnLCB0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlRWRpdE1vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ2VkaXQtbW9kZScsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgc2F2ZUVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhKCk7XG4gICAgICAgIHRoaXMud29ybGRzXG4gICAgICAgICAgICAudXBkYXRlVXNlcih0aGlzLm1vZGVsKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG1lLnJlbW92ZUVkaXRNb2RlKCk7XG4gICAgICAgICAgICAgICAgbWUuJGVsLnRyaWdnZXIoJ3VwZGF0ZScsIG1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlRWRpdE1vZGUoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0ZW1wbCA9IHRoaXMubW9kZWwuZ2V0KCdlZGl0LW1vZGUnKSA/IHRoaXMuZWRpdFRlbXBsYXRlIDogdGhpcy50ZW1wbGF0ZTtcbiAgICAgICAgdmFyIHZtID0gXy5leHRlbmQoe1xuICAgICAgICAgICAgcm9sZXM6IHRoaXMucHJvamVjdC5nZXQoJ3JvbGVzJyksXG4gICAgICAgICAgICBvcHRpb25hbFJvbGVzOiB0aGlzLnByb2plY3QuZ2V0KCdvcHRpb25hbFJvbGVzJyksXG4gICAgICAgICAgICB3b3JsZHM6IHRoaXMud29ybGRzLmdldFdvcmxkTmFtZXMoKSxcbiAgICAgICAgICAgIG5ld1dvcmxkOiB0aGlzLndvcmxkcy5nZXROZXh0V29ybGROYW1lKClcbiAgICAgICAgfSwgdGhpcy5tb2RlbC50b0pTT04oKSk7XG5cbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0ZW1wbCh2bSkpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHRoaXMuJCgnW2RhdGEtZmllbGRdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZWwgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGZpZWxkID0gZWwuZGF0YSgnZmllbGQnKTtcbiAgICAgICAgICAgIHZhciB2YWwgPSBlbC52YWwoKTtcblxuICAgICAgICAgICAgbWUubW9kZWwuc2V0KGZpZWxkLCB2YWwpO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc2lnbm1lbnRSb3c7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVXNlcnNDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi91c2Vycy1jb2xsZWN0aW9uJyk7XG52YXIgV29ybGRzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vd29ybGRzLWNvbGxlY3Rpb24nKTtcbnZhciBQcm9qZWN0TW9kZWwgPSByZXF1aXJlKCcuL3Byb2plY3QtbW9kZWwnKTtcbnZhciBBc3NpZ25lbW50Um93ID0gcmVxdWlyZSgnLi9hc3NpZ25tZW50LXJvdycpO1xudmFyIGVudiA9IHJlcXVpcmUoJy4vZGVmYXVsdHMnKTtcbnZhciBBamF4UXVldWUgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2FqYXgtcXVldWUnKTtcblxuZnVuY3Rpb24gc2V0RW52aXJvbm1lbnQob3B0aW9ucykge1xuICAgIGVudi5zZXQoXy5vbWl0KG9wdGlvbnMsICdlbCcpKTtcbn1cblxudmFyIEFzc2lnbm1lbnQgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHNldEVudmlyb25tZW50KG9wdGlvbnMpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZShvcHRpb25zKTtcbn07XG5cbkFzc2lnbm1lbnQucHJvdG90eXBlID0ge1xuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5lbCA9IHR5cGVvZiBvcHRpb25zLmVsID09PSAnc3RyaW5nJyA/ICQob3B0aW9ucy5lbClbMF0gOiBvcHRpb25zLmVsO1xuICAgICAgICB0aGlzLiRlbCA9ICQodGhpcy5lbCk7XG4gICAgICAgIHRoaXMuJCA9IF8ucGFydGlhbFJpZ2h0KCQsIHRoaXMuZWwpO1xuXG4gICAgICAgIHRoaXMudXNlcnMgPSBuZXcgVXNlcnNDb2xsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMud29ybGRzID0gbmV3IFdvcmxkc0NvbGxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy5wcm9qZWN0ID0gbmV3IFByb2plY3RNb2RlbCgpO1xuXG4gICAgICAgIF8uYmluZEFsbCh0aGlzLCBbJ3JlbmRlcicsICdyZW5kZXJUYWJsZScsICd0b2dnbGVDb250cm9sbHMnLCAnc2F2ZUVkaXQnLCAnc2VsZWN0QWxsJywgJ3VzYXNzaWduU2VsZWN0ZWQnLCAnX3Nob3dVcGRhdGluZycsICdfaGlkZVVwZGF0aW5nJywgJ2F1dG9Bc3NpZ25BbGwnLCAnbWFrZVVzZXJJbmFjdGl2ZSddKTtcblxuICAgICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5vbigndXBkYXRlJywgJ3RyJywgdGhpcy5zYXZlRWRpdCk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICdpbnB1dDpjaGVja2JveDpub3QoI3NlbGVjdC1hbGwpJywgdGhpcy50b2dnbGVDb250cm9sbHMpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnI3NlbGVjdC1hbGwnLCB0aGlzLnNlbGVjdEFsbCk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcudW5hc3NpZ24tdXNlcicsIHRoaXMudXNhc3NpZ25TZWxlY3RlZCk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcuYXV0by1hc3NpZ24tYWxsJywgdGhpcy5hdXRvQXNzaWduQWxsKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy5tYWtlLXVzZXItaW5hY3RpdmUnLCB0aGlzLm1ha2VVc2VySW5hY3RpdmUpO1xuICAgIH0sXG5cbiAgICBsb2FkOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgdmFyIGpvaW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkcy5zZXRVc2Vyc0NvbGxlY3Rpb24odGhpcy51c2Vycyk7XG4gICAgICAgICAgICB0aGlzLndvcmxkcy5qb2luVXNlcnMoKTtcbiAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gJC53aGVuKFxuICAgICAgICAgICAgdGhpcy53b3JsZHMuZmV0Y2goKSxcbiAgICAgICAgICAgIHRoaXMudXNlcnMuZmV0Y2goKSxcbiAgICAgICAgICAgIHRoaXMucHJvamVjdC5mZXRjaCgpXG4gICAgICAgICkudGhlbihqb2luKTtcblxuICAgIH0sXG5cbiAgICBzYXZlRWRpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLndvcmxkcy5mZXRjaCgpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZHMuam9pblVzZXJzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xzKCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBhdXRvQXNzaWduQWxsOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX3Nob3dVcGRhdGluZygpO1xuICAgICAgICB2YXIgbWF4VXNlcnMgPSArdGhpcy4kKCcjbWF4LXVzZXJzJykudmFsKCk7XG4gICAgICAgIHJldHVybiB0aGlzLndvcmxkcy5hdXRvQXNzaWduQWxsKHsgbWF4VXNlcnM6IG1heFVzZXJzIH0pXG4gICAgICAgICAgICAudGhlbih0aGlzLl9oaWRlVXBkYXRpbmcpXG4gICAgICAgICAgICAuZmFpbCh0aGlzLl9oaWRlVXBkYXRpbmcpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZHMuam9pblVzZXJzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIGdldFNlbGVjdGVkSWRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveDpjaGVja2VkJykubWFwKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkKHRoaXMpLmRhdGEoJ2lkJyk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBmaW5kUm93Vmlld3M6IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgICAgcmV0dXJuIF8ubWFwKGlkcywgZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5yb3dWaWV3c1tpZF07XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICB1bmFzc2lnblVzZXJzOiBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgZHRkLnJlc29sdmUoKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBmb3Igbm93IHdlIG5lZWQgdG8gc2VxdWVuY2UgdGhlIGNhbGxzIHRvIHVuYXNzaWduIHVzZXJzIGZyb20gd29ybGRzXG4gICAgICAgIHZhciBxdWV1ZSA9IG5ldyBBamF4UXVldWUoKTtcblxuICAgICAgICBfLmVhY2goaWRzLCBmdW5jdGlvbiAodXNlcklkKSB7XG4gICAgICAgICAgICB2YXIgdXNlciA9IHRoaXMudXNlcnMuZ2V0QnlJZCh1c2VySWQpO1xuICAgICAgICAgICAgdXNlci5zZXQoJ3dvcmxkJywgJycpO1xuICAgICAgICAgICAgdXNlci5zZXQoJ3JvbGUnLCAnJyk7XG4gICAgICAgICAgICBxdWV1ZS5hZGQoXy5wYXJ0aWFsKF8uYmluZCh0aGlzLndvcmxkcy51cGRhdGVVc2VyLCB0aGlzLndvcmxkcyksIHVzZXIpKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgcXVldWUuZXhlY3V0ZSh0aGlzKS50aGVuKGRvbmUpO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH0sXG5cbiAgICB1c2Fzc2lnblNlbGVjdGVkOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIGlkcyA9IHRoaXMuZ2V0U2VsZWN0ZWRJZHMoKTtcblxuICAgICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMud29ybGRzLmZldGNoKCkudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53b3JsZHMuam9pblVzZXJzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5faGlkZVVwZGF0aW5nKCk7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcblxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuX3Nob3dVcGRhdGluZygpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnVuYXNzaWduVXNlcnMoaWRzKS50aGVuKGRvbmUpO1xuICAgIH0sXG5cbiAgICBtYWtlVXNlckluYWN0aXZlOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciBpZHMgPSB0aGlzLmdldFNlbGVjdGVkSWRzKCk7XG4gICAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy50b2dnbGVDb250cm9sbHMoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHZhciBtYWtlVXNlcnNJbmFjdGl2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciByb3dzID0gdGhpcy5maW5kUm93Vmlld3MoaWRzKTtcbiAgICAgICAgICAgIC8vIGZvciBub3cgd2UgbmVlZCB0byBzZXF1ZW5jZSB0aGUgY2FsbHMgdG8gcGF0Y2ggdGhlIHVzZXJzXG4gICAgICAgICAgICAvLyBzaW5jZSB0aGUgQVBJIGNhbiBvbmx5IG9wZXJhdGUgb24gb25lIGNhbGwgcGVyIGdyb3VwIGF0IGEgdGltZVxuICAgICAgICAgICAgdmFyIHF1ZXVlID0gbmV3IEFqYXhRdWV1ZSgpO1xuICAgICAgICAgICAgXy5lYWNoKHJvd3MsIGZ1bmN0aW9uICh2aWV3KSB7XG4gICAgICAgICAgICAgICAgdmFyIHVzZXIgPSB2aWV3Lm1vZGVsO1xuICAgICAgICAgICAgICAgIHF1ZXVlLmFkZChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2aWV3Lm1ha2VJbmFjdGl2ZSgpXG4gICAgICAgICAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXNlci5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2aWV3LnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgICBxdWV1ZS5leGVjdXRlKHRoaXMpLnRoZW4oZG9uZSk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gdGhpcy51bmFzc2lnblVzZXJzKGlkcylcbiAgICAgICAgICAgIC50aGVuKG1ha2VVc2Vyc0luYWN0aXZlKTtcblxuXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiQoJ3RhYmxlIHRib2R5JykuZW1wdHkoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJUYWJsZSgpO1xuICAgICAgICB0aGlzLnRvZ2dsZUNvbnRyb2xscygpO1xuICAgIH0sXG5cbiAgICByZW5kZXJUYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJvd1ZpZXdzID0ge307XG4gICAgICAgIHZhciByb3dzID0gW107XG4gICAgICAgIHRoaXMudXNlcnMuZWFjaChmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgQXNzaWduZW1udFJvdyh7IG1vZGVsOiB1LCB3b3JsZHM6IHRoaXMud29ybGRzLCBwcm9qZWN0OiB0aGlzLnByb2plY3QgfSk7XG4gICAgICAgICAgICB0aGlzLnJvd1ZpZXdzW3UuZ2V0KCdpZCcpXSA9IHZpZXc7XG4gICAgICAgICAgICByb3dzLnB1c2godmlldy5yZW5kZXIoKS5lbCk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuJCgndGFibGUgdGJvZHknKS5hcHBlbmQocm93cyk7XG4gICAgfSxcblxuXG4gICAgdXBkYXRlQ29udHJvbHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sc0ZvclNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLnVwZGF0ZUF1dG9Bc3NpZ25CdXR0b24oKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0dXMoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbmNvbXBsZXRlV29ybGRzID0gdGhpcy53b3JsZHMuZ2V0SW5jb21wbGV0ZVdvcmxkc0NvdW50KCk7XG4gICAgICAgIHZhciB1bmFzc2lnbmVkVXNlcnMgPSB0aGlzLnVzZXJzLmdldFVuYXNzaWduZWRVc2Vyc0NvdW50KCk7XG4gICAgICAgIHZhciB0b3RhbFdvcmxkcyA9IHRoaXMud29ybGRzLnNpemUoKTtcblxuICAgICAgICB2YXIgdXNlcnNUZXh0ID0gJ0FsbCB1c2VycyBoYXZlIGJlZW4gYXNzaWduZWQuJztcbiAgICAgICAgaWYgKHVuYXNzaWduZWRVc2Vycykge1xuICAgICAgICAgICAgdXNlcnNUZXh0ID0gdW5hc3NpZ25lZFVzZXJzID09PSAxID8gJzEgdXNlciBuZWVkcyBhc3NpZ25tZW50LicgOiB1bmFzc2lnbmVkVXNlcnMgKyAnIHVzZXJzIG5lZWQgYXNzaWdubWVudC4nO1xuICAgICAgICB9XG4gICAgICAgIHZhciB3b3JsZHNUZXh0ID0gJ0FsbCB3b3JsZHMgYXJlIGNvbXBsZXRlLic7XG4gICAgICAgIGlmICghdG90YWxXb3JsZHMpIHtcbiAgICAgICAgICAgIHdvcmxkc1RleHQgPSAnTm8gd29ybGRzIGhhdmUgYmVlbiBjcmVhdGVkLic7XG4gICAgICAgIH0gZWxzZSBpZiAoaW5jb21wbGV0ZVdvcmxkcykge1xuICAgICAgICAgICAgd29ybGRzVGV4dCA9IGluY29tcGxldGVXb3JsZHMgPT09IDEgPyAnMSBpbmNvbXBsZXRlIHdvcmxkIG5lZWRzIGF0dGVudGlvbi4nIDogaW5jb21wbGV0ZVdvcmxkcyArICcgaW5jb21wbGV0ZSB3b3JsZHMgbmVlZCBhdHRlbnRpb24uJztcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJCgnI3VzZXJzLXN0YXR1cyAudGV4dCcpLnRleHQodXNlcnNUZXh0KTtcbiAgICAgICAgdGhpcy4kKCcjd29ybGRzLXN0YXR1cyAudGV4dCcpLnRleHQod29ybGRzVGV4dCk7XG5cbiAgICAgICAgaWYgKHVuYXNzaWduZWRVc2Vycykge1xuICAgICAgICAgICAgdGhpcy4kKCcjdXNlcnMtc3RhdHVzJykuYWRkQ2xhc3MoJ2luY29tcGxldGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3VzZXJzLXN0YXR1cycpLnJlbW92ZUNsYXNzKCdpbmNvbXBsZXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5jb21wbGV0ZVdvcmxkcyB8fCAhdG90YWxXb3JsZHMpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3dvcmxkcy1zdGF0dXMnKS5hZGRDbGFzcygnaW5jb21wbGV0ZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcjd29ybGRzLXN0YXR1cycpLnJlbW92ZUNsYXNzKCdpbmNvbXBsZXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiQoJy5zdGF0dXMtd2lkZ2V0JykuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlQ29udHJvbHNGb3JTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG51bVNlbGVjdGVkID0gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3g6Y2hlY2tlZCcpLmxlbmd0aDtcbiAgICAgICAgdGhpcy4kKCcuY29tcG9uZW50LmNvbnRyb2xzJylbbnVtU2VsZWN0ZWQgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oJ3Zpc2libGUnKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlQXV0b0Fzc2lnbkJ1dHRvbjogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmICh0aGlzLnByb2plY3QuaXNEeW5hbWljQXNzaWdubWVudCgpKSB7XG4gICAgICAgICAgICB2YXIgaGFzUm9sZXMgPSB0aGlzLnByb2plY3QuaGFzUm9sZXMoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5zaW5nbGUnKS5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuZHluYW1pYycpLnNob3coKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5keW5hbWljLW5vLXJvbGVzLXRleHQnKVtoYXNSb2xlcyA/ICdoaWRlJyA6ICdzaG93J10oKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5uby1yb2xlcycpW2hhc1JvbGVzID8gJ2hpZGUnIDogJ3Nob3cnXSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLmR5bmFtaWMnKS5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuZHluYW1pYy1uby1yb2xlcy10ZXh0JykuaGlkZSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLnNpbmdsZScpLnNob3coKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5uby1yb2xlcycpLnNob3coKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudXNlcnMuYWxsVXNlcnNBc3NpZ25lZCgpKSB7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scycpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scycpLmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2VsZWN0QWxsOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveCcpLnByb3AoJ2NoZWNrZWQnLCBlLnRhcmdldC5jaGVja2VkKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9scygpO1xuICAgIH0sXG5cbiAgICB0b2dnbGVDb250cm9sbHM6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciB0b3RhbCA9IHRoaXMuJCgndGJvZHkgOmNoZWNrYm94Jyk7XG4gICAgICAgIHZhciBjaGVja2VkID0gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3g6Y2hlY2tlZCcpO1xuXG4gICAgICAgIGlmICh0b3RhbC5sZW5ndGggPT09IGNoZWNrZWQubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyNzZWxlY3QtYWxsJykuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJyNzZWxlY3QtYWxsJykucmVtb3ZlQXR0cignY2hlY2tlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9scygpO1xuICAgIH0sXG5cbiAgICBfc2hvd1VwZGF0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLmNzcyh7IG9wYWNpdHk6IDAuNCB9KTtcbiAgICB9LFxuXG4gICAgX2hpZGVVcGRhdGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5jc3MoeyBvcGFjaXR5OiAxIH0pO1xuICAgIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBc3NpZ25tZW50OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEJhc2VDb2xsZWN0aW9uID0gZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xuICAgIHRoaXMuX21vZGVscyA9IFtdO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5fLmV4dGVuZChCYXNlQ29sbGVjdGlvbi5wcm90b3R5cGUsIHtcbiAgICBpZEF0dHJpYnV0ZTogJ2lkJyxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICB9LFxuXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAoYXR0ciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgbSA9IG5ldyB0aGlzLm1vZGVsKGF0dHIsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnNldChtKTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAobW9kZWxzLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX21vZGVscy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnNldChtb2RlbHMpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICBfLnJlbW92ZSh0aGlzLl9tb2RlbHMsIGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gbSA9PT0gbW9kZWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlbGV0ZSBtb2RlbC5jb2xsZWN0aW9uO1xuXG4gICAgICAgIHJldHVybiBtb2RlbDtcbiAgICB9LFxuXG4gICAgc2V0OiBmdW5jdGlvbiAobW9kZWxzKSB7XG4gICAgICAgIGlmICghbW9kZWxzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBtb2RlbHMgPSBbXS5jb25jYXQobW9kZWxzKTtcblxuICAgICAgICBpZiAoIW1vZGVscy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uZWFjaChtb2RlbHMsIGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBpZiAoIShtIGluc3RhbmNlb2YgdGhpcy5tb2RlbCkpIHtcbiAgICAgICAgICAgICAgICBtID0gbmV3IHRoaXMubW9kZWwobSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG0uY29sbGVjdGlvbiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuX21vZGVscy5wdXNoKG0pO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLnNvcnQoKTtcblxuICAgICAgICByZXR1cm4gbW9kZWxzO1xuICAgIH0sXG5cbiAgICBzb3J0Rm46IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBiLl9kYXRhW3RoaXMuaWRBdHRyaWJ1dGVdIC0gYS5fZGF0YVt0aGlzLmlkQXR0cmlidXRlXTtcbiAgICB9LFxuXG4gICAgc29ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tb2RlbHMgPSB0aGlzLl9tb2RlbHMuc29ydCh0aGlzLnNvcnRGbi5iaW5kKHRoaXMpKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fbW9kZWxzO1xuICAgIH0sXG5cbiAgICBnZXRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIF8uZmluZCh0aGlzLl9tb2RlbHMsIGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5nZXQodGhpcy5pZEF0dHJpYnV0ZSkgPT09IGlkO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgZWFjaDogZnVuY3Rpb24gKGNiLCBjdHgpIHtcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLl9tb2RlbHMsIGNiLCBjdHggfHwgdGhpcyk7XG4gICAgfSxcblxuICAgIGFsbDogZnVuY3Rpb24gKGNiLCBjdHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYWxsKHRoaXMuX21vZGVscywgY2IsIGN0eCB8fCB0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfLmludm9rZSh0aGlzLl9tb2RlbHMsICd0b0pTT04nKTtcbiAgICB9LFxuXG4gICAgZmluZDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBfLmZpbmQodGhpcy5fbW9kZWxzLCBmbik7XG4gICAgfSxcblxuICAgIGZpbHRlcjogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBfLmZpbHRlcih0aGlzLl9tb2RlbHMsIGZuKTtcbiAgICB9LFxuXG4gICAgc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbW9kZWxzLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgbWFwOiBmdW5jdGlvbiAoZm4sIGN0eCkge1xuICAgICAgICByZXR1cm4gXy5tYXAodGhpcy5fbW9kZWxzLCBmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKGN0eCwgbW9kZWwudG9KU09OKCkpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcGx1Y2s6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiBtW2ZpZWxkXTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlQ29sbGVjdGlvbjsiLCIndXNlIHN0cmljdCc7XG5cblxudmFyIEJhc2VNb2RlbCA9IGZ1bmN0aW9uIChhdHRyLCBvcHRpb25zKSB7XG4gICAgYXR0ciA9IF8uZGVmYXVsdHMoe30sIGF0dHIsIF8ucmVzdWx0KHRoaXMsICdkZWZhdWx0cycpKTtcbiAgICB0aGlzLl9kYXRhID0ge307XG4gICAgdGhpcy5zZXQoYXR0ciwgb3B0aW9ucyk7XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5fLmV4dGVuZChCYXNlTW9kZWwucHJvdG90eXBlLCB7XG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKGF0dHIsIG9wdGlvbnMpIHtcblxuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbCwgb3B0aW9ucykge1xuICAgICAgICBpZiAoa2V5ID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhdHRycztcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBhdHRycyA9IGtleTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMuX2RhdGEsIGF0dHJzKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiAoa2V5LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2tleV07XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHRvSlNPTjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICB9LFxuXG4gICAgcGljazogZnVuY3Rpb24gKGtleXMpIHtcbiAgICAgICAgcmV0dXJuIF8ucGljayh0aGlzLl9kYXRhLCBrZXlzKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VNb2RlbDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBlbnYgPSB7XG4gICAgYWNjb3VudDogJycsXG4gICAgcHJvamVjdDogJycsXG4gICAgZ3JvdXA6ICcnLFxuICAgIGdyb3VwSWQ6ICcnLFxuICAgIHRva2VuOiAnJyxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgaG9zdDogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICBwcm90b2NvbDogJ2h0dHBzJ1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgZW52ID0gXy5tZXJnZShlbnYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGVudjtcbiAgICB9XG59OyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBBcHAgPSByZXF1aXJlKCcuL2Fzc2lnbm1lbnQuanMnKTtcblxuICAgIHdpbmRvdy5mb3JpbyA9IHdpbmRvdy5mb3JpbyB8fCB7fTtcbiAgICB3aW5kb3cuZm9yaW8uTXVsdGlwbGF5ZXJBc3NpZ25tZW50Q29tcG9uZW50ID0gQXBwO1xufSgpKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtbW9kZWwnKTtcbi8vIHZhciBfX3N1cGVyID0gQmFzZS5wcm90b3R5cGU7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcblxuICAgIGlzRHluYW1pY0Fzc2lnbm1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KCd3b3JsZHMnKSA9PT0gJ2R5bmFtaWMnO1xuICAgIH0sXG5cbiAgICBoYXNSb2xlczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcm9sZXMgPSB0aGlzLmdldCgncm9sZXMnKTtcbiAgICAgICAgcmV0dXJuIHJvbGVzICYmICEhcm9sZXMubGVuZ3RoO1xuICAgIH0sXG5cbiAgICBmZXRjaDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXBpID0gc2VydmljZUxvY2F0b3Iud29ybGRBcGkoKTtcblxuICAgICAgICByZXR1cm4gYXBpLmdldFByb2plY3RTZXR0aW5ncygpLnRoZW4oZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICAgICAgICB0aGlzLnNldChzZXR0aW5ncyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW52ID0gcmVxdWlyZSgnLi9kZWZhdWx0cy5qcycpO1xuXG52YXIgY2FjaGUgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgd29ybGRBcGk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjYWNoZS53b3JsZEFwaSkge1xuICAgICAgICAgICAgY2FjaGUud29ybGRBcGkgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKGVudi5nZXQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FjaGUud29ybGRBcGk7XG4gICAgfSxcblxuICAgIG1lbWJlckFwaTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNhY2hlLm1lbWJlckFwaSkge1xuICAgICAgICAgICAgY2FjaGUubWVtYmVyQXBpID0gbmV3IEYuc2VydmljZS5NZW1iZXIoXy5waWNrKGVudi5nZXQoKSwgWydncm91cElkJywgJ3NlcnZlciddKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FjaGUubWVtYmVyQXBpO1xuICAgIH0sXG5cbiAgICB1c2VyQXBpOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY2FjaGUudXNlckFwaSkge1xuICAgICAgICAgICAgY2FjaGUudXNlckFwaSA9IG5ldyBGLnNlcnZpY2UuVXNlcihfLnBpY2soZW52LmdldCgpLCBbJ2FjY291bnQnLCAnc2VydmVyJ10pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWNoZS51c2VyQXBpO1xuICAgIH1cbn07IiwiZXhwb3J0c1tcImVkaXQtdXNlci1yb3dcIl0gPSBmdW5jdGlvbihvYmopIHtcbm9iaiB8fCAob2JqID0ge30pO1xudmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcbmZ1bmN0aW9uIHByaW50KCkgeyBfX3AgKz0gX19qLmNhbGwoYXJndW1lbnRzLCAnJykgfVxud2l0aCAob2JqKSB7XG5fX3AgKz0gJzx0ZD48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2xhc3M9XCJzZWxlY3RcIiBkYXRhLWlkPVwiJyArXG4oKF9fdCA9ICggaWQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCI8L3RkPlxcbjx0ZD48L3RkPlxcbjx0ZD5cXG4gICAgPHNlbGVjdCBuYW1lPVwid29ybGRzXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBkYXRhLWZpZWxkPVwid29ybGRcIj5cXG5cXG4gICAgJztcbiBfLmVhY2god29ybGRzLCBmdW5jdGlvbiAodykgeyA7XG5fX3AgKz0gJ1xcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIicgK1xuKChfX3QgPSAoIHcgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCIgJyArXG4oKF9fdCA9ICggdyA9PT0gd29ybGQgPyAnc2VsZWN0ZWQnIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPicgK1xuKChfX3QgPSAoIHcgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC9vcHRpb24+XFxuICAgICc7XG4gfSk7IDtcbl9fcCArPSAnXFxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiJyArXG4oKF9fdCA9ICggbmV3V29ybGQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCIgY2xhc3M9XCJuZXctd29ybGQtdGV4dFwiPjxpPicgK1xuKChfX3QgPSAoIG5ld1dvcmxkICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJyAtIE5ldyAtPC9pPjwvb3B0aW9uPlxcbiAgICA8L3NlbGVjdD5cXG48L3RkPlxcbjx0ZD5cXG4gICAgPHNlbGVjdCBuYW1lPVwicm9sZXNcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtZmllbGQ9XCJyb2xlXCI+XFxuICAgICc7XG4gXy5lYWNoKHJvbGVzLCBmdW5jdGlvbiAocikgeyA7XG5fX3AgKz0gJ1xcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIicgK1xuKChfX3QgPSAoIHIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCIgJyArXG4oKF9fdCA9ICggciA9PT0gcm9sZSA/ICdzZWxlY3RlZCcgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic+JyArXG4oKF9fdCA9ICggciApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L29wdGlvbj5cXG4gICAgJztcbiB9KTsgO1xuX19wICs9ICdcXG5cXG4gICAgJztcbiBfLmVhY2gob3B0aW9uYWxSb2xlcywgZnVuY3Rpb24gKHIpIHsgO1xuX19wICs9ICdcXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCInICtcbigoX190ID0gKCByICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiICcgK1xuKChfX3QgPSAoIHIgPT09IHJvbGUgPyAnc2VsZWN0ZWQnIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPicgK1xuKChfX3QgPSAoIHIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nIDxpPihPcHRpb25hbCk8L2k+PC9vcHRpb24+XFxuICAgICc7XG4gfSk7IDtcbl9fcCArPSAnXFxuICAgIDwvc2VsZWN0PlxcbjwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIGxhc3ROYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIHVzZXJOYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoICF3b3JsZCA/ICc8ZW0gY2xhc3M9XCJmLWljb24gZi13YXJuaW5nXCI+PC9lbT4nIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQgY2xhc3M9XCJhY3Rpb25zXCI+XFxuICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgYnRuLXRvb2xzIGJ0bi1zYXZlIHNhdmVcIj5TYXZlPC9idXR0b24+XFxuICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLXRvb2xzIGJ0bi1jYW5jZWwgY2FuY2VsXCI+Q2FuY2VsPC9idXR0b24+XFxuPC90ZD4nO1xuXG59XG5yZXR1cm4gX19wXG59O1xuZXhwb3J0c1tcInVzZXItcm93XCJdID0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZTtcbndpdGggKG9iaikge1xuX19wICs9ICc8dGQ+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNsYXNzPVwic2VsZWN0XCIgZGF0YS1pZD1cIicgK1xuKChfX3QgPSAoIGlkKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCI8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCAhaXNXb3JsZENvbXBsZXRlID8gJzxlbSBjbGFzcz1cImYtaWNvbiBmLXdhcm5pbmdcIj48L2VtPicgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCB3b3JsZCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCByb2xlICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIGxhc3ROYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIHVzZXJOYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoICF3b3JsZCA/ICc8ZW0gY2xhc3M9XCJmLWljb24gZi13YXJuaW5nXCI+PC9lbT4nIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQgY2xhc3M9XCJhY3Rpb25zXCI+PGJ1dHRvbiBjbGFzcz1cImJ0biBlZGl0IGJ0bi1lZGl0IGJ0bi10b29scyBhdXRvLWhpZGVcIj5FZGl0PC9idXR0b24+PC90ZD4nO1xuXG59XG5yZXR1cm4gX19wXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtbW9kZWwnKTtcbnZhciBzZXJ2aWNlTG9jYXRvciA9IHJlcXVpcmUoJy4vc2VydmljZS1sb2NhdG9yJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIHdvcmxkOiAnJyxcbiAgICAgICAgcm9sZTogJycsXG4gICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgaXNXb3JsZENvbXBsZXRlOiB0cnVlLFxuICAgICAgICBmaXJzdE5hbWU6ICcnLFxuICAgICAgICBsYXN0TmFtZTogJydcbiAgICB9LFxuXG4gICAgbWFrZUFjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWVtYmVyQXBpID0gc2VydmljZUxvY2F0b3IubWVtYmVyQXBpKCk7XG4gICAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMuZ2V0KCdpZCcpLFxuICAgICAgICAgICAgZ3JvdXBJZDogdGhpcy5nZXQoJ2dyb3VwSWQnKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXMuZ2V0KCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5zZXQoJ2FjdGl2ZScsIHRydWUpO1xuXG4gICAgICAgIHJldHVybiBtZW1iZXJBcGkubWFrZVVzZXJBY3RpdmUocGFyYW1zKVxuICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIHJldmVydCB0aGUgY2hhbmdlXG4gICAgICAgICAgICAgICAgdGhpcy5zZXQoJ2FjdGl2ZScsIG9yaWdpbmFsKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIG1ha2VJbmFjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWVtYmVyQXBpID0gc2VydmljZUxvY2F0b3IubWVtYmVyQXBpKCk7XG4gICAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgICAgICB1c2VySWQ6IHRoaXMuZ2V0KCdpZCcpLFxuICAgICAgICAgICAgZ3JvdXBJZDogdGhpcy5nZXQoJ2dyb3VwSWQnKVxuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXMuZ2V0KCdhY3RpdmUnKTtcbiAgICAgICAgdGhpcy5zZXQoJ2FjdGl2ZScsIGZhbHNlKTtcblxuICAgICAgICByZXR1cm4gbWVtYmVyQXBpLm1ha2VVc2VySW5hY3RpdmUocGFyYW1zKVxuICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIC8vIHJldmVydCB0aGUgY2hhbmdlXG4gICAgICAgICAgICAgICAgdGhpcy5zZXQoJ2FjdGl2ZScsIG9yaWdpbmFsKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxuXG59KTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xuXG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL3VzZXItbW9kZWwnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLWNvbGxlY3Rpb24nKTtcbnZhciBlbnYgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyk7XG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBtb2RlbDogTW9kZWwsXG5cbiAgICBzb3J0Rm46IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhdyA9IGEuZ2V0KCd3b3JsZCcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBidyA9IGIuZ2V0KCd3b3JsZCcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChhdyAhPT0gYncpIHtcbiAgICAgICAgICAgIHJldHVybiBhdyA8IGJ3ID8gLTEgOiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGIuZ2V0KCd1c2VyTmFtZScpID4gYS5nZXQoJ3VzZXJOYW1lJykgPyAtMSA6IDE7XG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIGVudi5nZXQoKS50b2tlblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWxsVXNlcnNBc3NpZ25lZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbGwoZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXUuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0VW5hc3NpZ25lZFVzZXJzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICByZXR1cm4gIXUuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB9KS5sZW5ndGg7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHZhciBncm91cElkID0gZW52LmdldCgpLmdyb3VwSWQ7XG5cbiAgICAgICAgdmFyIGdldEdyb3VwVXNlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbWVtYmVyQXBpID0gc2VydmljZUxvY2F0b3IubWVtYmVyQXBpKCk7XG4gICAgICAgICAgICB2YXIgdXNlckFwaSA9IHNlcnZpY2VMb2NhdG9yLnVzZXJBcGkoKTtcblxuICAgICAgICAgICAgdmFyIGxvYWRHcm91cE1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lbWJlckFwaS5nZXRHcm91cERldGFpbHMoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBsb2FkVXNlcnNJbmZvID0gZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vbkZhY0FuZEFjdGl2ZSA9IGZ1bmN0aW9uICh1KSB7IHJldHVybiB1LmFjdGl2ZSAmJiB1LnJvbGUgIT09ICdmYWNpbGl0YXRvcic7IH07XG4gICAgICAgICAgICAgICAgdmFyIHVzZXJzID0gXy5wbHVjayhfLmZpbHRlcihncm91cC5tZW1iZXJzLCBub25GYWNBbmRBY3RpdmUpLCAndXNlcklkJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJBcGkuZ2V0KHsgaWQ6IHVzZXJzIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGxvYWRHcm91cE1lbWJlcnMoKVxuICAgICAgICAgICAgICAgIC50aGVuKGxvYWRVc2Vyc0luZm8pXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZ2V0R3JvdXBVc2VycygpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcbiAgICAgICAgICAgICAgICB1c2VycyA9IF8ubWFwKHVzZXJzLCBmdW5jdGlvbiAodSkgeyByZXR1cm4gXy5leHRlbmQodSwgeyBncm91cElkOiBncm91cElkIH0pOyB9KTtcbiAgICAgICAgICAgICAgICBtZS5zZXQodXNlcnMpO1xuICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKHVzZXJzKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtbW9kZWwnKTtcbnZhciBfX3N1cGVyID0gQmFzZS5wcm90b3R5cGU7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcblxuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIHVzZXJzOiBudWxsLFxuICAgICAgICBtb2RlbDogJ21vZGVsLmVxbidcbiAgICB9LFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBfX3N1cGVyLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcblxuICAgICAgICB0aGlzLl9kYXRhLnVzZXJzID0gdGhpcy5fZGF0YS51c2VycyB8fCBbXTtcblxuICAgICAgICB0aGlzLl93b3JsZEFwaSA9IHNlcnZpY2VMb2NhdG9yLndvcmxkQXBpKCk7XG5cbiAgICAgICAgdmFyIGlkID0gdGhpcy5nZXQoJ2lkJyk7XG4gICAgICAgIGlmIChpZCkge1xuICAgICAgICAgICAgdGhpcy5fd29ybGRBcGkudXBkYXRlQ29uZmlnKHsgZmlsdGVyOiBpZCB9KTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBhZGRVc2VyOiBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB2YXIgdXNlcnMgPSB0aGlzLmdldCgndXNlcnMnKTtcbiAgICAgICAgdXNlcnMucHVzaCh1c2VyKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5zYXZlKCk7XG4gICAgfSxcblxuICAgIHJlbW92ZVVzZXI6IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIHZhciBpZCA9IHRoaXMuZ2V0KCdpZCcpO1xuICAgICAgICB2YXIgY2hlY2tXb3JsZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy5nZXQoJ3VzZXJzJykubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5fd29ybGRBcGkudXBkYXRlQ29uZmlnKHsgZmlsdGVyOiBpZCB9KS5kZWxldGUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIF8ucmVtb3ZlKHRoaXMuZ2V0KCd1c2VycycpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgcmV0dXJuIHUuZ2V0KCdpZCcpID09PSB1c2VyLmdldCgnaWQnKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmxkQXBpXG4gICAgICAgICAgICAudXBkYXRlQ29uZmlnKHsgZmlsdGVyOiBpZCB9KVxuICAgICAgICAgICAgLnJlbW92ZVVzZXIoeyB1c2VySWQ6IHVzZXIuZ2V0KCdpZCcpIH0pXG4gICAgICAgICAgICAudGhlbihjaGVja1dvcmxkKTtcbiAgICB9LFxuXG4gICAgc2F2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgbWFwVXNlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5tYXAodGhpcy5nZXQoJ3VzZXJzJyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgdmFyIHJlcyA9IHsgdXNlcklkOiB1LmdldCgnaWQnKSB9O1xuICAgICAgICAgICAgICAgIHZhciByb2xlID0gdS5nZXQoJ3JvbGUnKTtcblxuICAgICAgICAgICAgICAgIGlmIChyb2xlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJlcy5yb2xlID0gcm9sZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB2YXIgY3JlYXRlV29ybGQgPSBfLnBhcnRpYWwodGhpcy5fd29ybGRBcGkuY3JlYXRlLCB0aGlzLnBpY2soWydtb2RlbCcsICduYW1lJywgJ21pblVzZXJzJ10pKTtcbiAgICAgICAgdmFyIGFkZFVzZXJzID0gXy5wYXJ0aWFsKG1lLl93b3JsZEFwaS5hZGRVc2VycywgbWFwVXNlcnMoKSwgeyBmaWx0ZXI6IG1lLmdldCgnaWQnKSB9KTtcbiAgICAgICAgdmFyIHNhdmVkVXNlcnMgPSB0aGlzLmdldCgndXNlcnMnKTtcbiAgICAgICAgaWYgKHRoaXMuaXNOZXcoKSkge1xuICAgICAgICAgICAgLy8gd2UgbmVlZCB0byBjcmVhdGUgdGhlIHdvcmxkIGluIHRoZSBBUEkgYW5kIHRoZW4gYWRkIHRoZSB1c2Vyc1xuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVdvcmxkKClcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgICAgICAgICAgbWUuc2V0KHdvcmxkKTtcbiAgICAgICAgICAgICAgICAgICAgbWUuX3dvcmxkQXBpLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogd29ybGQuaWQgfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihhZGRVc2VycylcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2luY2Ugd2UgcmUtc2V0IHRoZSB3b3JsZCwgcmUtc2V0IHRoZSB1c2Vyc1xuICAgICAgICAgICAgICAgICAgICBtZS5zZXQoJ3VzZXJzJywgc2F2ZWRVc2Vycyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB0aGUgd29ybGQgaXMgYWxyZWFkeSBjcmVhdGVkIGp1c3QgYWRkIHRoZSB1c2Vyc1xuICAgICAgICAgICAgcmV0dXJuIGFkZFVzZXJzKCk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgaXNOZXc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuICF0aGlzLmdldCgnbGFzdE1vZGlmaWVkJyk7XG4gICAgfVxuXG59KTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBNb2RlbCA9IHJlcXVpcmUoJy4vd29ybGQtbW9kZWwnKTtcbnZhciBVc2VyTW9kZWwgPSByZXF1aXJlKCcuL3VzZXItbW9kZWwnKTtcbnZhciBzZXJ2aWNlTG9jYXRvciA9IHJlcXVpcmUoJy4vc2VydmljZS1sb2NhdG9yJyk7XG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLWNvbGxlY3Rpb24nKTtcbnZhciBfX3N1cGVyID0gQmFzZS5wcm90b3R5cGU7XG5cbnZhciBkb25lRm4gPSBmdW5jdGlvbiAoZHRkLCBhZnRlcikge1xuICAgIHJldHVybiBfLmFmdGVyKGFmdGVyLCBkdGQucmVzb2x2ZSk7XG59O1xuXG52YXIgd29ybGRBcGk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBtb2RlbDogTW9kZWwsXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9fc3VwZXIuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB3b3JsZEFwaSA9IHNlcnZpY2VMb2NhdG9yLndvcmxkQXBpKCk7XG4gICAgfSxcblxuICAgIGF1dG9Bc3NpZ25BbGw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB3b3JsZEFwaS5hdXRvQXNzaWduKG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGRzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCh0aGlzLnBhcnNlKHdvcmxkcykpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5jb21wbGV0ZVdvcmxkc0NvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihmdW5jdGlvbiAodykge1xuICAgICAgICAgICAgcmV0dXJuICF3LmdldCgnY29tcGxldGUnKTtcbiAgICAgICAgfSkubGVuZ3RoO1xuICAgIH0sXG5cbiAgICB1cGRhdGVVc2VyOiBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB2YXIgd29ybGROYW1lID0gdXNlci5nZXQoJ3dvcmxkJyk7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBwcmV2V29ybGQgPSB0aGlzLmdldFdvcmxkQnlVc2VyKHVzZXIpO1xuICAgICAgICB2YXIgY3VyV29ybGQgPSB0aGlzLmdldE9yQ3JlYXRlV29ybGQod29ybGROYW1lKTtcbiAgICAgICAgdmFyIGRvbmUgPSBkb25lRm4oZHRkLCAxKTtcblxuICAgICAgICAvLyBjaGVjayBpZiB0aGVyZSdzIGFueXRoaW5nIHRvIGRvXG4gICAgICAgIGlmICghcHJldldvcmxkICYmICFjdXJXb3JsZCkge1xuICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZXZXb3JsZCkge1xuICAgICAgICAgICAgcHJldldvcmxkLnJlbW92ZVVzZXIodXNlcilcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJXb3JsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cldvcmxkLmFkZFVzZXIodXNlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGRvbmUpO1xuICAgICAgICB9IGVsc2UgaWYgKGN1cldvcmxkKSB7XG4gICAgICAgICAgICBjdXJXb3JsZC5hZGRVc2VyKHVzZXIpXG4gICAgICAgICAgICAgICAgLnRoZW4oZG9uZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgZ2V0T3JDcmVhdGVXb3JsZDogZnVuY3Rpb24gKHdvcmxkTmFtZSkge1xuICAgICAgICBpZiAoIXdvcmxkTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdvcmxkID0gdGhpcy5nZXRXb3JkQnlOYW1lKHdvcmxkTmFtZSk7XG5cbiAgICAgICAgaWYgKCF3b3JsZCkge1xuICAgICAgICAgICAgd29ybGQgPSB0aGlzLmNyZWF0ZSh7IG5hbWU6IHdvcmxkTmFtZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgZ2V0V29yZEJ5TmFtZTogZnVuY3Rpb24gKHdvcmxkTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmdldCgnbmFtZScpID09PSB3b3JsZE5hbWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRXb3JsZEJ5VXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgaWYgKCF1c2VyLmdldCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdnZXRXb3JsZEJ5VXNlciBleHBlY3RlcyBhIG1vZGVsICgnICsgdXNlciArICcpJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaWQgPSB1c2VyLmdldCgnaWQnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0V29ybGRCeVVzZXJJZChpZCk7XG4gICAgfSxcblxuICAgIGdldFdvcmxkQnlVc2VySWQ6IGZ1bmN0aW9uICh1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLmZpbmQod29ybGQuZ2V0KCd1c2VycycpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1LmdldCgnaWQnKSA9PT0gdXNlcklkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRXb3JsZE5hbWVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWNrKCduYW1lJykuc29ydCgpO1xuICAgIH0sXG5cbiAgICBnZXROZXh0V29ybGROYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYWQgPSBmdW5jdGlvbiAobnVtLCBwbGFjZXMpIHtcbiAgICAgICAgICAgIHZhciB6ZXJvcyA9ICcwMDAwMDAwMDAwMDAwMDAwMDAnO1xuICAgICAgICAgICAgdmFyIGRpZ2l0cyA9IG51bS50b1N0cmluZygpLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBuZWVkZWQgPSBwbGFjZXMgLSBkaWdpdHM7XG4gICAgICAgICAgICByZXR1cm4gemVyb3Muc3Vic3RyKDAsIG5lZWRlZCkgKyBudW07XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHdvcmxkcyA9IHRoaXMuZ2V0V29ybGROYW1lcygpO1xuXG4gICAgICAgIGlmICghd29ybGRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuICdXb3JsZDAwMSc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvcGVyTmFtZXMgPSBfLmZpbHRlcih3b3JsZHMsIGZ1bmN0aW9uICh3KSB7IHJldHVybiAoL1dvcmxkXFxkXFxkXFxkLykudGVzdCh3KTsgfSkuc29ydCgpO1xuICAgICAgICB2YXIgbGFzdFdvcmxkID0gcHJvcGVyTmFtZXNbcHJvcGVyTmFtZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBudW1Xb3JsZCA9ICtsYXN0V29ybGQubWF0Y2goL1dvcmxkKFxcZFxcZFxcZCkvKVsxXTtcbiAgICAgICAgdmFyIHBsYWNlc1RvUGFkID0gMztcbiAgICAgICAgcmV0dXJuICdXb3JsZCcgKyBwYWQobnVtV29ybGQgKyAxLCBwbGFjZXNUb1BhZCk7XG4gICAgfSxcblxuICAgIHNldFVzZXJzQ29sbGVjdGlvbjogZnVuY3Rpb24gKHVzZXJzQ29sbGVjdGlvbikge1xuICAgICAgICB0aGlzLnVzZXJzQ29sbGVjdGlvbiA9IHVzZXJzQ29sbGVjdGlvbjtcbiAgICB9LFxuXG4gICAgam9pblVzZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1c2Vyc0hhc2ggPSB7fTtcbiAgICAgICAgdmFyIHVzZXJzQ29sbGVjdGlvbiA9IHRoaXMudXNlcnNDb2xsZWN0aW9uO1xuICAgICAgICB1c2Vyc0NvbGxlY3Rpb24uZWFjaChmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgdS5zZXQoeyBpc1dvcmxkQ29tcGxldGU6IHRydWUgfSk7XG4gICAgICAgICAgICByZXR1cm4gKHVzZXJzSGFzaFt1LmdldCgnaWQnKV0gPSB1KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICh3LCBpKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHcuZ2V0KCduYW1lJyk7XG4gICAgICAgICAgICB2YXIgaXNDb21wbGV0ZSA9IHcuZ2V0KCdjb21wbGV0ZScpO1xuICAgICAgICAgICAgdy5zZXQoeyBpbmRleDogaSwgbmFtZTogbmFtZSB8fCAoaSArIDEpICsgJycgfSk7XG4gICAgICAgICAgICBfLmVhY2gody5nZXQoJ3VzZXJzJyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJzSGFzaFt1LmdldCgndXNlcklkJyldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJzSGFzaFt1LmdldCgndXNlcklkJyldLnNldCh7IHdvcmxkOiBuYW1lLCByb2xlOiB1LmdldCgncm9sZScpLCBpc1dvcmxkQ29tcGxldGU6IGlzQ29tcGxldGUgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHVzZXJzQ29sbGVjdGlvbi5zb3J0KCk7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB3b3JsZEFwaS5saXN0KClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KHRoaXMucGFyc2Uod29ybGRzKSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBwYXJzZTogZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICBpZiAod29ybGRzLmxlbmd0aCkge1xuICAgICAgICAgICAgd29ybGRzID0gXy5tYXAod29ybGRzLCBmdW5jdGlvbiAodykge1xuICAgICAgICAgICAgICAgIHZhciB1c2VycyA9IF8ubWFwKHcudXNlcnMsIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSB3b3JsZCBhcGkgdXNlcnMgSWRzIGNvbWVzIGFzIHVzZXJJZFxuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UgYWRkIGl0IGFzIGlkIHNvIHdlIGNhbiB1c2UgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhbWUgY29kZSB0byBhY2Nlc3MgbW9kZWxzIHRoYXQgY29tZSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBtZW1iZXIvbG9jYWwgYXBpIGFzIHdpdGggdGhlIHdvcmxkIGFwaVxuICAgICAgICAgICAgICAgICAgICB1LmlkID0gdS51c2VySWQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVXNlck1vZGVsKHUpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdy51c2VycyA9IHVzZXJzO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3b3JsZHM7XG4gICAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBVdGlsaXR5IGNsYXNzIHRvIG1ha2UgYWpheCBjYWxscyBzZXF1ZW5jaWFsXG4qL1xuZnVuY3Rpb24gQWpheFF1ZXVlKCkge1xuICAgIHRoaXMucXVldWUgPSBbXTtcbn1cblxuJC5leHRlbmQoQWpheFF1ZXVlLnByb3RvdHlwZSwge1xuICAgIGFkZDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnF1ZXVlLnB1c2goZm4pO1xuICAgIH0sXG5cbiAgICBleGVjdXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dCB8fCB0aGlzO1xuXG4gICAgICAgIGZ1bmN0aW9uIG5leHQoKSB7XG4gICAgICAgICAgICBpZiAobWUucXVldWUubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZuID0gbWUucXVldWUuc2hpZnQoKTtcblxuICAgICAgICAgICAgICAgIGZuLmNhbGwoY29udGV4dClcbiAgICAgICAgICAgICAgICAgICAgLnRoZW4obmV4dClcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBuZXh0KCk7XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfVxufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBBamF4UXVldWU7IiwiLyoqXG4vKiBJbmhlcml0IGZyb20gYSBjbGFzcyAodXNpbmcgcHJvdG90eXBlIGJvcnJvd2luZylcbiovXG4ndXNlIHN0cmljdCc7XG5cbmZ1bmN0aW9uIGluaGVyaXQoQywgUCkge1xuICAgIHZhciBGID0gZnVuY3Rpb24gKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBQLnByb3RvdHlwZTtcbiAgICBDLnByb3RvdHlwZSA9IG5ldyBGKCk7XG4gICAgQy5fX3N1cGVyID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDO1xufVxuXG4vKipcbiogU2hhbGxvdyBjb3B5IG9mIGFuIG9iamVjdFxuKiBAcGFyYW0ge09iamVjdH0gZGVzdCBvYmplY3QgdG8gZXh0ZW5kXG4qIEByZXR1cm4ge09iamVjdH0gZXh0ZW5kZWQgb2JqZWN0XG4qL1xudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIChkZXN0IC8qLCB2YXJfYXJncyovKSB7XG4gICAgdmFyIG9iaiA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmoubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCEoY3VycmVudCA9IG9ialtqXSkpIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRvIG5vdCB3cmFwIGlubmVyIGluIGRlc3QuaGFzT3duUHJvcGVydHkgb3IgYmFkIHRoaW5ncyB3aWxsIGhhcHBlblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY3VycmVudCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIGRlc3Rba2V5XSA9IGN1cnJlbnRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYmFzZSwgcHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgdmFyIHBhcmVudCA9IGJhc2U7XG4gICAgdmFyIGNoaWxkO1xuXG4gICAgY2hpbGQgPSBwcm9wcyAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSA/IHByb3BzLmNvbnN0cnVjdG9yIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG5cbiAgICAvLyBhZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNoaWxkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgZXh0ZW5kKGNoaWxkLCBwYXJlbnQsIHN0YXRpY1Byb3BzKTtcblxuICAgIC8vIGFzc29jaWF0ZSBwcm90b3R5cGUgY2hhaW5cbiAgICBpbmhlcml0KGNoaWxkLCBwYXJlbnQpO1xuXG4gICAgLy8gYWRkIGluc3RhbmNlIHByb3BlcnRpZXNcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvcHMpO1xuICAgIH1cblxuICAgIC8vIGRvbmVcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuIl19
