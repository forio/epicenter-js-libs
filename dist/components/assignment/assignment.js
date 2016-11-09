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

function setEnvironment (options) {
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
        return this.pluck('name');
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
function AjaxQueue () {
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

        function next () {
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

function inherit (C, P) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Fzc2lnbm1lbnQtcm93LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9hc3NpZ25tZW50LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9iYXNlLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Jhc2UtbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2RlZmF1bHRzLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9pbmRleC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvcHJvamVjdC1tb2RlbC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvc2VydmljZS1sb2NhdG9yLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy90ZW1wbGF0ZXMuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXItbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXJzLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3dvcmxkLW1vZGVsLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy93b3JsZHMtY29sbGVjdGlvbi5qcyIsInNyYy91dGlsL2FqYXgtcXVldWUuanMiLCJzcmMvdXRpbC9pbmhlcml0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgdGVtcGxhdGVzID0gcmVxdWlyZSgnLi90ZW1wbGF0ZXMnKTtcblxudmFyIEFzc2lnbm1lbnRSb3cgPSBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgIHRoaXMuJGVsID0gJCgnPHRyPicpO1xuICAgIHRoaXMuZWwgPSB0aGlzLiRlbFswXTtcbiAgICB0aGlzLiQgPSBfLnBhcnRpYWxSaWdodCgkLCB0aGlzLiRlbCk7XG5cbiAgICB0aGlzLm1vZGVsID0gb3B0aW9ucy5tb2RlbDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMud29ybGRzID0gb3B0aW9ucy53b3JsZHM7XG4gICAgdGhpcy5wcm9qZWN0ID0gb3B0aW9ucy5wcm9qZWN0O1xuXG4gICAgXy5iaW5kQWxsKHRoaXMsIFsnc2V0RWRpdE1vZGUnLCAncmVtb3ZlRWRpdE1vZGUnLCAnc2F2ZUVkaXQnLCAnY2FuY2VsRWRpdCcsICd1cGRhdGVEYXRhJ10pO1xuXG4gICAgdGhpcy5iaW5kRXZlbnRzKCk7XG5cbn07XG5cbl8uZXh0ZW5kKEFzc2lnbm1lbnRSb3cucHJvdG90eXBlLCB7XG5cbiAgICB0ZW1wbGF0ZTogdGVtcGxhdGVzWyd1c2VyLXJvdyddLFxuXG4gICAgZWRpdFRlbXBsYXRlOiB0ZW1wbGF0ZXNbJ2VkaXQtdXNlci1yb3cnXSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJ2J1dHRvbi5lZGl0JywgdGhpcy5zZXRFZGl0TW9kZSk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICdidXR0b24uc2F2ZScsIHRoaXMuc2F2ZUVkaXQpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnYnV0dG9uLmNhbmNlbCcsIHRoaXMuY2FuY2VsRWRpdCk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5vZmYoJ2NsaWNrJywgbnVsbCwgbnVsbCk7XG4gICAgICAgIC8vIHRoaXMgb25seSBnaXZlcyBhIGRlbGF5IHRvIHJlbW92ZSB0aGUgdHJcbiAgICAgICAgLy8gYW5pbWF0aW9uIG9mIGhlaWdodCBvZiB0aGUgdHIgZG9lcyBub3Qgd29ya1xuICAgICAgICB0aGlzLiQoJzpjaGVja2JveCcpLmF0dHIoJ2NoZWNrZWQnLCBmYWxzZSk7XG4gICAgICAgIHRoaXMuJGVsXG4gICAgICAgICAgICAuY3NzKHsgb3BhY2l0eTogMC4zIH0pXG4gICAgICAgICAgICAuYW5pbWF0ZSh7IGhlaWdodDogMCB9LCB7XG4gICAgICAgICAgICAgICAgZHVyYXRpb246IDMwMCxcbiAgICAgICAgICAgICAgICBjb21wbGV0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBtYWtlSW5hY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubW9kZWwubWFrZUluYWN0aXZlKCk7XG4gICAgfSxcblxuICAgIHNldEVkaXRNb2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KCdlZGl0LW1vZGUnLCB0cnVlKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlRWRpdE1vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ2VkaXQtbW9kZScsIGZhbHNlKTtcbiAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICB9LFxuXG4gICAgc2F2ZUVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdGhpcy51cGRhdGVEYXRhKCk7XG4gICAgICAgIHRoaXMud29ybGRzXG4gICAgICAgICAgICAudXBkYXRlVXNlcih0aGlzLm1vZGVsKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIG1lLnJlbW92ZUVkaXRNb2RlKCk7XG4gICAgICAgICAgICAgICAgbWUuJGVsLnRyaWdnZXIoJ3VwZGF0ZScsIG1lKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucmVtb3ZlRWRpdE1vZGUoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB0ZW1wbCA9IHRoaXMubW9kZWwuZ2V0KCdlZGl0LW1vZGUnKSA/IHRoaXMuZWRpdFRlbXBsYXRlIDogdGhpcy50ZW1wbGF0ZTtcbiAgICAgICAgdmFyIHZtID0gXy5leHRlbmQoe1xuICAgICAgICAgICAgcm9sZXM6IHRoaXMucHJvamVjdC5nZXQoJ3JvbGVzJyksXG4gICAgICAgICAgICBvcHRpb25hbFJvbGVzOiB0aGlzLnByb2plY3QuZ2V0KCdvcHRpb25hbFJvbGVzJyksXG4gICAgICAgICAgICB3b3JsZHM6IHRoaXMud29ybGRzLmdldFdvcmxkTmFtZXMoKSxcbiAgICAgICAgICAgIG5ld1dvcmxkOiB0aGlzLndvcmxkcy5nZXROZXh0V29ybGROYW1lKClcbiAgICAgICAgfSwgdGhpcy5tb2RlbC50b0pTT04oKSk7XG5cbiAgICAgICAgdGhpcy4kZWwuaHRtbCh0ZW1wbCh2bSkpO1xuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB1cGRhdGVEYXRhOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBtZSA9IHRoaXM7XG4gICAgICAgIHRoaXMuJCgnW2RhdGEtZmllbGRdJykuZWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgZWwgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGZpZWxkID0gZWwuZGF0YSgnZmllbGQnKTtcbiAgICAgICAgICAgIHZhciB2YWwgPSBlbC52YWwoKTtcblxuICAgICAgICAgICAgbWUubW9kZWwuc2V0KGZpZWxkLCB2YWwpO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc2lnbm1lbnRSb3c7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgVXNlcnNDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi91c2Vycy1jb2xsZWN0aW9uJyk7XG52YXIgV29ybGRzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vd29ybGRzLWNvbGxlY3Rpb24nKTtcbnZhciBQcm9qZWN0TW9kZWwgPSByZXF1aXJlKCcuL3Byb2plY3QtbW9kZWwnKTtcbnZhciBBc3NpZ25lbW50Um93ID0gcmVxdWlyZSgnLi9hc3NpZ25tZW50LXJvdycpO1xudmFyIGVudiA9IHJlcXVpcmUoJy4vZGVmYXVsdHMnKTtcbnZhciBBamF4UXVldWUgPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2FqYXgtcXVldWUnKTtcblxuZnVuY3Rpb24gc2V0RW52aXJvbm1lbnQgKG9wdGlvbnMpIHtcbiAgICBlbnYuc2V0KF8ub21pdChvcHRpb25zLCAnZWwnKSk7XG59XG5cbnZhciBBc3NpZ25tZW50ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBzZXRFbnZpcm9ubWVudChvcHRpb25zKTtcbiAgICB0aGlzLmluaXRpYWxpemUob3B0aW9ucyk7XG59O1xuXG5Bc3NpZ25tZW50LnByb3RvdHlwZSA9IHtcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuZWwgPSB0eXBlb2Ygb3B0aW9ucy5lbCA9PT0gJ3N0cmluZycgPyAkKG9wdGlvbnMuZWwpWzBdIDogb3B0aW9ucy5lbDtcbiAgICAgICAgdGhpcy4kZWwgPSAkKHRoaXMuZWwpO1xuICAgICAgICB0aGlzLiQgPSBfLnBhcnRpYWxSaWdodCgkLCB0aGlzLmVsKTtcblxuICAgICAgICB0aGlzLnVzZXJzID0gbmV3IFVzZXJzQ29sbGVjdGlvbigpO1xuICAgICAgICB0aGlzLndvcmxkcyA9IG5ldyBXb3JsZHNDb2xsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG5ldyBQcm9qZWN0TW9kZWwoKTtcblxuICAgICAgICBfLmJpbmRBbGwodGhpcywgWydyZW5kZXInLCAncmVuZGVyVGFibGUnLCAndG9nZ2xlQ29udHJvbGxzJywgJ3NhdmVFZGl0JywgJ3NlbGVjdEFsbCcsICd1c2Fzc2lnblNlbGVjdGVkJywgJ19zaG93VXBkYXRpbmcnLCAnX2hpZGVVcGRhdGluZycsICdhdXRvQXNzaWduQWxsJywgJ21ha2VVc2VySW5hY3RpdmUnXSk7XG5cbiAgICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwub24oJ3VwZGF0ZScsICd0cicsIHRoaXMuc2F2ZUVkaXQpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnaW5wdXQ6Y2hlY2tib3g6bm90KCNzZWxlY3QtYWxsKScsIHRoaXMudG9nZ2xlQ29udHJvbGxzKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJyNzZWxlY3QtYWxsJywgdGhpcy5zZWxlY3RBbGwpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLnVuYXNzaWduLXVzZXInLCB0aGlzLnVzYXNzaWduU2VsZWN0ZWQpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLmF1dG8tYXNzaWduLWFsbCcsIHRoaXMuYXV0b0Fzc2lnbkFsbCk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcubWFrZS11c2VyLWluYWN0aXZlJywgdGhpcy5tYWtlVXNlckluYWN0aXZlKTtcbiAgICB9LFxuXG4gICAgbG9hZDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciBqb2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53b3JsZHMuc2V0VXNlcnNDb2xsZWN0aW9uKHRoaXMudXNlcnMpO1xuICAgICAgICAgICAgdGhpcy53b3JsZHMuam9pblVzZXJzKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgcmV0dXJuICQud2hlbihcbiAgICAgICAgICAgIHRoaXMud29ybGRzLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnVzZXJzLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnByb2plY3QuZmV0Y2goKVxuICAgICAgICApLnRoZW4oam9pbik7XG5cbiAgICB9LFxuXG4gICAgc2F2ZUVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy53b3JsZHMuZmV0Y2goKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb250cm9scygpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgYXV0b0Fzc2lnbkFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9zaG93VXBkYXRpbmcoKTtcbiAgICAgICAgdmFyIG1heFVzZXJzID0gK3RoaXMuJCgnI21heC11c2VycycpLnZhbCgpO1xuICAgICAgICByZXR1cm4gdGhpcy53b3JsZHMuYXV0b0Fzc2lnbkFsbCh7IG1heFVzZXJzOiBtYXhVc2VycyB9KVxuICAgICAgICAgICAgLnRoZW4odGhpcy5faGlkZVVwZGF0aW5nKVxuICAgICAgICAgICAgLmZhaWwodGhpcy5faGlkZVVwZGF0aW5nKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBnZXRTZWxlY3RlZElkczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3g6Y2hlY2tlZCcpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5kYXRhKCdpZCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZmluZFJvd1ZpZXdzOiBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgIHJldHVybiBfLm1hcChpZHMsIGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucm93Vmlld3NbaWRdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgdW5hc3NpZ25Vc2VyczogZnVuY3Rpb24gKGlkcykge1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGR0ZC5yZXNvbHZlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZm9yIG5vdyB3ZSBuZWVkIHRvIHNlcXVlbmNlIHRoZSBjYWxscyB0byB1bmFzc2lnbiB1c2VycyBmcm9tIHdvcmxkc1xuICAgICAgICB2YXIgcXVldWUgPSBuZXcgQWpheFF1ZXVlKCk7XG5cbiAgICAgICAgXy5lYWNoKGlkcywgZnVuY3Rpb24gKHVzZXJJZCkge1xuICAgICAgICAgICAgdmFyIHVzZXIgPSB0aGlzLnVzZXJzLmdldEJ5SWQodXNlcklkKTtcbiAgICAgICAgICAgIHVzZXIuc2V0KCd3b3JsZCcsICcnKTtcbiAgICAgICAgICAgIHVzZXIuc2V0KCdyb2xlJywgJycpO1xuICAgICAgICAgICAgcXVldWUuYWRkKF8ucGFydGlhbChfLmJpbmQodGhpcy53b3JsZHMudXBkYXRlVXNlciwgdGhpcy53b3JsZHMpLCB1c2VyKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHF1ZXVlLmV4ZWN1dGUodGhpcykudGhlbihkb25lKTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgdXNhc3NpZ25TZWxlY3RlZDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBpZHMgPSB0aGlzLmdldFNlbGVjdGVkSWRzKCk7XG5cbiAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkcy5mZXRjaCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVVcGRhdGluZygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLl9zaG93VXBkYXRpbmcoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy51bmFzc2lnblVzZXJzKGlkcykudGhlbihkb25lKTtcbiAgICB9LFxuXG4gICAgbWFrZVVzZXJJbmFjdGl2ZTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgaWRzID0gdGhpcy5nZXRTZWxlY3RlZElkcygpO1xuICAgICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ29udHJvbGxzKCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB2YXIgbWFrZVVzZXJzSW5hY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcm93cyA9IHRoaXMuZmluZFJvd1ZpZXdzKGlkcyk7XG4gICAgICAgICAgICAvLyBmb3Igbm93IHdlIG5lZWQgdG8gc2VxdWVuY2UgdGhlIGNhbGxzIHRvIHBhdGNoIHRoZSB1c2Vyc1xuICAgICAgICAgICAgLy8gc2luY2UgdGhlIEFQSSBjYW4gb25seSBvcGVyYXRlIG9uIG9uZSBjYWxsIHBlciBncm91cCBhdCBhIHRpbWVcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9IG5ldyBBamF4UXVldWUoKTtcbiAgICAgICAgICAgIF8uZWFjaChyb3dzLCBmdW5jdGlvbiAodmlldykge1xuICAgICAgICAgICAgICAgIHZhciB1c2VyID0gdmlldy5tb2RlbDtcbiAgICAgICAgICAgICAgICBxdWV1ZS5hZGQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmlldy5tYWtlSW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICAgICAgcXVldWUuZXhlY3V0ZSh0aGlzKS50aGVuKGRvbmUpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudW5hc3NpZ25Vc2VycyhpZHMpXG4gICAgICAgICAgICAudGhlbihtYWtlVXNlcnNJbmFjdGl2ZSk7XG5cblxuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kKCd0YWJsZSB0Ym9keScpLmVtcHR5KCk7XG4gICAgICAgIHRoaXMucmVuZGVyVGFibGUoKTtcbiAgICAgICAgdGhpcy50b2dnbGVDb250cm9sbHMoKTtcbiAgICB9LFxuXG4gICAgcmVuZGVyVGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yb3dWaWV3cyA9IHt9O1xuICAgICAgICB2YXIgcm93cyA9IFtdO1xuICAgICAgICB0aGlzLnVzZXJzLmVhY2goZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHZhciB2aWV3ID0gbmV3IEFzc2lnbmVtbnRSb3coeyBtb2RlbDogdSwgd29ybGRzOiB0aGlzLndvcmxkcywgcHJvamVjdDogdGhpcy5wcm9qZWN0IH0pO1xuICAgICAgICAgICAgdGhpcy5yb3dWaWV3c1t1LmdldCgnaWQnKV0gPSB2aWV3O1xuICAgICAgICAgICAgcm93cy5wdXNoKHZpZXcucmVuZGVyKCkuZWwpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLiQoJ3RhYmxlIHRib2R5JykuYXBwZW5kKHJvd3MpO1xuICAgIH0sXG5cblxuICAgIHVwZGF0ZUNvbnRyb2xzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbHNGb3JTZWxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy51cGRhdGVBdXRvQXNzaWduQnV0dG9uKCk7XG4gICAgICAgIHRoaXMudXBkYXRlU3RhdHVzKCk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1czogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgaW5jb21wbGV0ZVdvcmxkcyA9IHRoaXMud29ybGRzLmdldEluY29tcGxldGVXb3JsZHNDb3VudCgpO1xuICAgICAgICB2YXIgdW5hc3NpZ25lZFVzZXJzID0gdGhpcy51c2Vycy5nZXRVbmFzc2lnbmVkVXNlcnNDb3VudCgpO1xuICAgICAgICB2YXIgdG90YWxXb3JsZHMgPSB0aGlzLndvcmxkcy5zaXplKCk7XG5cbiAgICAgICAgdmFyIHVzZXJzVGV4dCA9ICdBbGwgdXNlcnMgaGF2ZSBiZWVuIGFzc2lnbmVkLic7XG4gICAgICAgIGlmICh1bmFzc2lnbmVkVXNlcnMpIHtcbiAgICAgICAgICAgIHVzZXJzVGV4dCA9IHVuYXNzaWduZWRVc2VycyA9PT0gMSA/ICcxIHVzZXIgbmVlZHMgYXNzaWdubWVudC4nIDogdW5hc3NpZ25lZFVzZXJzICsgJyB1c2VycyBuZWVkIGFzc2lnbm1lbnQuJztcbiAgICAgICAgfVxuICAgICAgICB2YXIgd29ybGRzVGV4dCA9ICdBbGwgd29ybGRzIGFyZSBjb21wbGV0ZS4nO1xuICAgICAgICBpZiAoIXRvdGFsV29ybGRzKSB7XG4gICAgICAgICAgICB3b3JsZHNUZXh0ID0gJ05vIHdvcmxkcyBoYXZlIGJlZW4gY3JlYXRlZC4nO1xuICAgICAgICB9IGVsc2UgaWYgKGluY29tcGxldGVXb3JsZHMpIHtcbiAgICAgICAgICAgIHdvcmxkc1RleHQgPSBpbmNvbXBsZXRlV29ybGRzID09PSAxID8gJzEgaW5jb21wbGV0ZSB3b3JsZCBuZWVkcyBhdHRlbnRpb24uJyA6IGluY29tcGxldGVXb3JsZHMgKyAnIGluY29tcGxldGUgd29ybGRzIG5lZWQgYXR0ZW50aW9uLic7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiQoJyN1c2Vycy1zdGF0dXMgLnRleHQnKS50ZXh0KHVzZXJzVGV4dCk7XG4gICAgICAgIHRoaXMuJCgnI3dvcmxkcy1zdGF0dXMgLnRleHQnKS50ZXh0KHdvcmxkc1RleHQpO1xuXG4gICAgICAgIGlmICh1bmFzc2lnbmVkVXNlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3VzZXJzLXN0YXR1cycpLmFkZENsYXNzKCdpbmNvbXBsZXRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJyN1c2Vycy1zdGF0dXMnKS5yZW1vdmVDbGFzcygnaW5jb21wbGV0ZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluY29tcGxldGVXb3JsZHMgfHwgIXRvdGFsV29ybGRzKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyN3b3JsZHMtc3RhdHVzJykuYWRkQ2xhc3MoJ2luY29tcGxldGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3dvcmxkcy1zdGF0dXMnKS5yZW1vdmVDbGFzcygnaW5jb21wbGV0ZScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy4kKCcuc3RhdHVzLXdpZGdldCcpLmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUNvbnRyb2xzRm9yU2VsZWN0aW9uOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBudW1TZWxlY3RlZCA9IHRoaXMuJCgndGJvZHkgOmNoZWNrYm94OmNoZWNrZWQnKS5sZW5ndGg7XG4gICAgICAgIHRoaXMuJCgnLmNvbXBvbmVudC5jb250cm9scycpW251bVNlbGVjdGVkID8gJ2FkZENsYXNzJyA6ICdyZW1vdmVDbGFzcyddKCd2aXNpYmxlJyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZUF1dG9Bc3NpZ25CdXR0b246IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICBpZiAodGhpcy5wcm9qZWN0LmlzRHluYW1pY0Fzc2lnbm1lbnQoKSkge1xuICAgICAgICAgICAgdmFyIGhhc1JvbGVzID0gdGhpcy5wcm9qZWN0Lmhhc1JvbGVzKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuc2luZ2xlJykuaGlkZSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLmR5bmFtaWMnKS5zaG93KCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuZHluYW1pYy1uby1yb2xlcy10ZXh0JylbaGFzUm9sZXMgPyAnaGlkZScgOiAnc2hvdyddKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAubm8tcm9sZXMnKVtoYXNSb2xlcyA/ICdoaWRlJyA6ICdzaG93J10oKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5keW5hbWljJykuaGlkZSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLmR5bmFtaWMtbm8tcm9sZXMtdGV4dCcpLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5zaW5nbGUnKS5zaG93KCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAubm8tcm9sZXMnKS5zaG93KCk7XG5cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLnVzZXJzLmFsbFVzZXJzQXNzaWduZWQoKSkge1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMnKS5yZW1vdmVDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMnKS5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIHNlbGVjdEFsbDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3gnKS5wcm9wKCdjaGVja2VkJywgZS50YXJnZXQuY2hlY2tlZCk7XG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbHMoKTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlQ29udHJvbGxzOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB2YXIgdG90YWwgPSB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveCcpO1xuICAgICAgICB2YXIgY2hlY2tlZCA9IHRoaXMuJCgndGJvZHkgOmNoZWNrYm94OmNoZWNrZWQnKTtcblxuICAgICAgICBpZiAodG90YWwubGVuZ3RoID09PSBjaGVja2VkLmxlbmd0aCkge1xuICAgICAgICAgICAgdGhpcy4kKCcjc2VsZWN0LWFsbCcpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcjc2VsZWN0LWFsbCcpLnJlbW92ZUF0dHIoJ2NoZWNrZWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudXBkYXRlQ29udHJvbHMoKTtcbiAgICB9LFxuXG4gICAgX3Nob3dVcGRhdGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5jc3MoeyBvcGFjaXR5OiAwLjQgfSk7XG4gICAgfSxcblxuICAgIF9oaWRlVXBkYXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwuY3NzKHsgb3BhY2l0eTogMSB9KTtcbiAgICB9XG5cbn07XG5cbm1vZHVsZS5leHBvcnRzID0gQXNzaWdubWVudDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBCYXNlQ29sbGVjdGlvbiA9IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICB0aGlzLl9tb2RlbHMgPSBbXTtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuXy5leHRlbmQoQmFzZUNvbGxlY3Rpb24ucHJvdG90eXBlLCB7XG4gICAgaWRBdHRyaWJ1dGU6ICdpZCcsXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAobW9kZWxzLCBvcHRpb25zKSB7XG4gICAgfSxcblxuICAgIGNyZWF0ZTogZnVuY3Rpb24gKGF0dHIsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIG0gPSBuZXcgdGhpcy5tb2RlbChhdHRyLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5zZXQobSk7XG4gICAgICAgIHJldHVybiBtO1xuICAgIH0sXG5cbiAgICByZXNldDogZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xuICAgICAgICB0aGlzLl9tb2RlbHMubGVuZ3RoID0gMDtcbiAgICAgICAgdGhpcy5zZXQobW9kZWxzKTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgXy5yZW1vdmUodGhpcy5fbW9kZWxzLCBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIG0gPT09IG1vZGVsO1xuICAgICAgICB9KTtcblxuICAgICAgICBkZWxldGUgbW9kZWwuY29sbGVjdGlvbjtcblxuICAgICAgICByZXR1cm4gbW9kZWw7XG4gICAgfSxcblxuICAgIHNldDogZnVuY3Rpb24gKG1vZGVscykge1xuICAgICAgICBpZiAoIW1vZGVscykge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgbW9kZWxzID0gW10uY29uY2F0KG1vZGVscyk7XG5cbiAgICAgICAgaWYgKCFtb2RlbHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBfLmVhY2gobW9kZWxzLCBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgaWYgKCEobSBpbnN0YW5jZW9mIHRoaXMubW9kZWwpKSB7XG4gICAgICAgICAgICAgICAgbSA9IG5ldyB0aGlzLm1vZGVsKG0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBtLmNvbGxlY3Rpb24gPSB0aGlzO1xuXG4gICAgICAgICAgICB0aGlzLl9tb2RlbHMucHVzaChtKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy5zb3J0KCk7XG5cbiAgICAgICAgcmV0dXJuIG1vZGVscztcbiAgICB9LFxuXG4gICAgc29ydEZuOiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICByZXR1cm4gYi5fZGF0YVt0aGlzLmlkQXR0cmlidXRlXSAtIGEuX2RhdGFbdGhpcy5pZEF0dHJpYnV0ZV07XG4gICAgfSxcblxuICAgIHNvcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fbW9kZWxzID0gdGhpcy5fbW9kZWxzLnNvcnQodGhpcy5zb3J0Rm4uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX21vZGVscztcbiAgICB9LFxuXG4gICAgZ2V0QnlJZDogZnVuY3Rpb24gKGlkKSB7XG4gICAgICAgIHJldHVybiBfLmZpbmQodGhpcy5fbW9kZWxzLCBmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIG0uZ2V0KHRoaXMuaWRBdHRyaWJ1dGUpID09PSBpZDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIGVhY2g6IGZ1bmN0aW9uIChjYiwgY3R4KSB7XG4gICAgICAgIHJldHVybiBfLmVhY2godGhpcy5fbW9kZWxzLCBjYiwgY3R4IHx8IHRoaXMpO1xuICAgIH0sXG5cbiAgICBhbGw6IGZ1bmN0aW9uIChjYiwgY3R4KSB7XG4gICAgICAgIHJldHVybiBfLmFsbCh0aGlzLl9tb2RlbHMsIGNiLCBjdHggfHwgdGhpcyk7XG4gICAgfSxcblxuICAgIHRvSlNPTjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gXy5pbnZva2UodGhpcy5fbW9kZWxzLCAndG9KU09OJyk7XG4gICAgfSxcblxuICAgIGZpbmQ6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gXy5maW5kKHRoaXMuX21vZGVscywgZm4pO1xuICAgIH0sXG5cbiAgICBmaWx0ZXI6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gXy5maWx0ZXIodGhpcy5fbW9kZWxzLCBmbik7XG4gICAgfSxcblxuICAgIHNpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX21vZGVscy5sZW5ndGg7XG4gICAgfSxcblxuICAgIG1hcDogZnVuY3Rpb24gKGZuLCBjdHgpIHtcbiAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMuX21vZGVscywgZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgICAgICByZXR1cm4gZm4uY2FsbChjdHgsIG1vZGVsLnRvSlNPTigpKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIHBsdWNrOiBmdW5jdGlvbiAoZmllbGQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gbVtmaWVsZF07XG4gICAgICAgIH0pO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQmFzZUNvbGxlY3Rpb247IiwiJ3VzZSBzdHJpY3QnO1xuXG5cbnZhciBCYXNlTW9kZWwgPSBmdW5jdGlvbiAoYXR0ciwgb3B0aW9ucykge1xuICAgIGF0dHIgPSBfLmRlZmF1bHRzKHt9LCBhdHRyLCBfLnJlc3VsdCh0aGlzLCAnZGVmYXVsdHMnKSk7XG4gICAgdGhpcy5fZGF0YSA9IHt9O1xuICAgIHRoaXMuc2V0KGF0dHIsIG9wdGlvbnMpO1xuICAgIHRoaXMuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xufTtcblxuXy5leHRlbmQoQmFzZU1vZGVsLnByb3RvdHlwZSwge1xuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChhdHRyLCBvcHRpb25zKSB7XG5cbiAgICB9LFxuXG4gICAgc2V0OiBmdW5jdGlvbiAoa2V5LCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKGtleSA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgYXR0cnMgPSBrZXk7XG4gICAgICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICBfLmV4dGVuZCh0aGlzLl9kYXRhLCBhdHRycyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtrZXldO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLnJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgfSxcblxuICAgIHBpY2s6IGZ1bmN0aW9uIChrZXlzKSB7XG4gICAgICAgIHJldHVybiBfLnBpY2sodGhpcy5fZGF0YSwga2V5cyk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTW9kZWw7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW52ID0ge1xuICAgIGFjY291bnQ6ICcnLFxuICAgIHByb2plY3Q6ICcnLFxuICAgIGdyb3VwOiAnJyxcbiAgICBncm91cElkOiAnJyxcbiAgICB0b2tlbjogJycsXG4gICAgc2VydmVyOiB7XG4gICAgICAgIGhvc3Q6ICdhcGkuZm9yaW8uY29tJyxcbiAgICAgICAgcHJvdG9jb2w6ICdodHRwcydcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGVudiA9IF8ubWVyZ2UoZW52LCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBlbnY7XG4gICAgfVxufTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgQXBwID0gcmVxdWlyZSgnLi9hc3NpZ25tZW50LmpzJyk7XG5cbiAgICB3aW5kb3cuZm9yaW8gPSB3aW5kb3cuZm9yaW8gfHwge307XG4gICAgd2luZG93LmZvcmlvLk11bHRpcGxheWVyQXNzaWdubWVudENvbXBvbmVudCA9IEFwcDtcbn0oKSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZXJ2aWNlTG9jYXRvciA9IHJlcXVpcmUoJy4vc2VydmljZS1sb2NhdG9yJyk7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1vZGVsJyk7XG4vLyB2YXIgX19zdXBlciA9IEJhc2UucHJvdG90eXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG5cbiAgICBpc0R5bmFtaWNBc3NpZ25tZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldCgnd29ybGRzJykgPT09ICdkeW5hbWljJztcbiAgICB9LFxuXG4gICAgaGFzUm9sZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJvbGVzID0gdGhpcy5nZXQoJ3JvbGVzJyk7XG4gICAgICAgIHJldHVybiByb2xlcyAmJiAhIXJvbGVzLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFwaSA9IHNlcnZpY2VMb2NhdG9yLndvcmxkQXBpKCk7XG5cbiAgICAgICAgcmV0dXJuIGFwaS5nZXRQcm9qZWN0U2V0dGluZ3MoKS50aGVuKGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgICAgICAgdGhpcy5zZXQoc2V0dGluZ3MpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGVudiA9IHJlcXVpcmUoJy4vZGVmYXVsdHMuanMnKTtcblxudmFyIGNhY2hlID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHdvcmxkQXBpOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY2FjaGUud29ybGRBcGkpIHtcbiAgICAgICAgICAgIGNhY2hlLndvcmxkQXBpID0gbmV3IEYuc2VydmljZS5Xb3JsZChlbnYuZ2V0KCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhY2hlLndvcmxkQXBpO1xuICAgIH0sXG5cbiAgICBtZW1iZXJBcGk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjYWNoZS5tZW1iZXJBcGkpIHtcbiAgICAgICAgICAgIGNhY2hlLm1lbWJlckFwaSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKF8ucGljayhlbnYuZ2V0KCksIFsnZ3JvdXBJZCcsICdzZXJ2ZXInXSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhY2hlLm1lbWJlckFwaTtcbiAgICB9LFxuXG4gICAgdXNlckFwaTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNhY2hlLnVzZXJBcGkpIHtcbiAgICAgICAgICAgIGNhY2hlLnVzZXJBcGkgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoXy5waWNrKGVudi5nZXQoKSwgWydhY2NvdW50JywgJ3NlcnZlciddKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FjaGUudXNlckFwaTtcbiAgICB9XG59OyIsImV4cG9ydHNbXCJlZGl0LXVzZXItcm93XCJdID0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZSwgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG5mdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cbndpdGggKG9iaikge1xuX19wICs9ICc8dGQ+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNsYXNzPVwic2VsZWN0XCIgZGF0YS1pZD1cIicgK1xuKChfX3QgPSAoIGlkICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiPC90ZD5cXG48dGQ+PC90ZD5cXG48dGQ+XFxuICAgIDxzZWxlY3QgbmFtZT1cIndvcmxkc1wiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgZGF0YS1maWVsZD1cIndvcmxkXCI+XFxuXFxuICAgICc7XG4gXy5lYWNoKHdvcmxkcywgZnVuY3Rpb24gKHcpIHsgO1xuX19wICs9ICdcXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCInICtcbigoX190ID0gKCB3ICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiICcgK1xuKChfX3QgPSAoIHcgPT09IHdvcmxkID8gJ3NlbGVjdGVkJyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJz4nICtcbigoX190ID0gKCB3ICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvb3B0aW9uPlxcbiAgICAnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIicgK1xuKChfX3QgPSAoIG5ld1dvcmxkICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiIGNsYXNzPVwibmV3LXdvcmxkLXRleHRcIj48aT4nICtcbigoX190ID0gKCBuZXdXb3JsZCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgLSBOZXcgLTwvaT48L29wdGlvbj5cXG4gICAgPC9zZWxlY3Q+XFxuPC90ZD5cXG48dGQ+XFxuICAgIDxzZWxlY3QgbmFtZT1cInJvbGVzXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBkYXRhLWZpZWxkPVwicm9sZVwiPlxcbiAgICAnO1xuIF8uZWFjaChyb2xlcywgZnVuY3Rpb24gKHIpIHsgO1xuX19wICs9ICdcXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCInICtcbigoX190ID0gKCByICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiICcgK1xuKChfX3QgPSAoIHIgPT09IHJvbGUgPyAnc2VsZWN0ZWQnIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPicgK1xuKChfX3QgPSAoIHIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC9vcHRpb24+XFxuICAgICc7XG4gfSk7IDtcbl9fcCArPSAnXFxuXFxuICAgICc7XG4gXy5lYWNoKG9wdGlvbmFsUm9sZXMsIGZ1bmN0aW9uIChyKSB7IDtcbl9fcCArPSAnXFxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiJyArXG4oKF9fdCA9ICggciApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIiAnICtcbigoX190ID0gKCByID09PSByb2xlID8gJ3NlbGVjdGVkJyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJz4nICtcbigoX190ID0gKCByICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJyA8aT4oT3B0aW9uYWwpPC9pPjwvb3B0aW9uPlxcbiAgICAnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcbiAgICA8L3NlbGVjdD5cXG48L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCBsYXN0TmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCB1c2VyTmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCAhd29ybGQgPyAnPGVtIGNsYXNzPVwiZi1pY29uIGYtd2FybmluZ1wiPjwvZW0+JyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkIGNsYXNzPVwiYWN0aW9uc1wiPlxcbiAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi10b29scyBidG4tc2F2ZSBzYXZlXCI+U2F2ZTwvYnV0dG9uPlxcbiAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi10b29scyBidG4tY2FuY2VsIGNhbmNlbFwiPkNhbmNlbDwvYnV0dG9uPlxcbjwvdGQ+JztcblxufVxucmV0dXJuIF9fcFxufTtcbmV4cG9ydHNbXCJ1c2VyLXJvd1wiXSA9IGZ1bmN0aW9uKG9iaikge1xub2JqIHx8IChvYmogPSB7fSk7XG52YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGU7XG53aXRoIChvYmopIHtcbl9fcCArPSAnPHRkPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cInNlbGVjdFwiIGRhdGEtaWQ9XCInICtcbigoX190ID0gKCBpZCkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggIWlzV29ybGRDb21wbGV0ZSA/ICc8ZW0gY2xhc3M9XCJmLWljb24gZi13YXJuaW5nXCI+PC9lbT4nIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggd29ybGQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggcm9sZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCBsYXN0TmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCB1c2VyTmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCAhd29ybGQgPyAnPGVtIGNsYXNzPVwiZi1pY29uIGYtd2FybmluZ1wiPjwvZW0+JyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkIGNsYXNzPVwiYWN0aW9uc1wiPjxidXR0b24gY2xhc3M9XCJidG4gZWRpdCBidG4tZWRpdCBidG4tdG9vbHMgYXV0by1oaWRlXCI+RWRpdDwvYnV0dG9uPjwvdGQ+JztcblxufVxucmV0dXJuIF9fcFxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1vZGVsJyk7XG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBkZWZhdWx0czoge1xuICAgICAgICB3b3JsZDogJycsXG4gICAgICAgIHJvbGU6ICcnLFxuICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgIGlzV29ybGRDb21wbGV0ZTogdHJ1ZSxcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcbiAgICAgICAgbGFzdE5hbWU6ICcnXG4gICAgfSxcblxuICAgIG1ha2VBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lbWJlckFwaSA9IHNlcnZpY2VMb2NhdG9yLm1lbWJlckFwaSgpO1xuICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgdXNlcklkOiB0aGlzLmdldCgnaWQnKSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IHRoaXMuZ2V0KCdncm91cElkJylcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLmdldCgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gbWVtYmVyQXBpLm1ha2VVc2VyQWN0aXZlKHBhcmFtcylcbiAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBvcmlnaW5hbCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBtYWtlSW5hY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lbWJlckFwaSA9IHNlcnZpY2VMb2NhdG9yLm1lbWJlckFwaSgpO1xuICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgdXNlcklkOiB0aGlzLmdldCgnaWQnKSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IHRoaXMuZ2V0KCdncm91cElkJylcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLmdldCgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuIG1lbWJlckFwaS5tYWtlVXNlckluYWN0aXZlKHBhcmFtcylcbiAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBvcmlnaW5hbCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi91c2VyLW1vZGVsJyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1jb2xsZWN0aW9uJyk7XG52YXIgZW52ID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgbW9kZWw6IE1vZGVsLFxuXG4gICAgc29ydEZuOiBmdW5jdGlvbiAoYSwgYikge1xuICAgICAgICB2YXIgYXcgPSBhLmdldCgnd29ybGQnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICB2YXIgYncgPSBiLmdldCgnd29ybGQnKS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICBpZiAoYXcgIT09IGJ3KSB7XG4gICAgICAgICAgICByZXR1cm4gYXcgPCBidyA/IC0xIDogMTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBiLmdldCgndXNlck5hbWUnKSA+IGEuZ2V0KCd1c2VyTmFtZScpID8gLTEgOiAxO1xuICAgIH0sXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICBBdXRob3JpemF0aW9uOiAnQmVhcmVyICcgKyBlbnYuZ2V0KCkudG9rZW5cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGFsbFVzZXJzQXNzaWduZWQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuYWxsKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICByZXR1cm4gISF1LmdldCgnd29ybGQnKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGdldFVuYXNzaWduZWRVc2Vyc0NvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgcmV0dXJuICF1LmdldCgnd29ybGQnKTtcbiAgICAgICAgfSkubGVuZ3RoO1xuICAgIH0sXG5cbiAgICBmZXRjaDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgbWUgPSB0aGlzO1xuICAgICAgICB2YXIgZ3JvdXBJZCA9IGVudi5nZXQoKS5ncm91cElkO1xuXG4gICAgICAgIHZhciBnZXRHcm91cFVzZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIG1lbWJlckFwaSA9IHNlcnZpY2VMb2NhdG9yLm1lbWJlckFwaSgpO1xuICAgICAgICAgICAgdmFyIHVzZXJBcGkgPSBzZXJ2aWNlTG9jYXRvci51c2VyQXBpKCk7XG5cbiAgICAgICAgICAgIHZhciBsb2FkR3JvdXBNZW1iZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBtZW1iZXJBcGkuZ2V0R3JvdXBEZXRhaWxzKCk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICB2YXIgbG9hZFVzZXJzSW5mbyA9IGZ1bmN0aW9uIChncm91cCkge1xuICAgICAgICAgICAgICAgIHZhciBub25GYWNBbmRBY3RpdmUgPSBmdW5jdGlvbiAodSkgeyByZXR1cm4gdS5hY3RpdmUgJiYgdS5yb2xlICE9PSAnZmFjaWxpdGF0b3InOyB9O1xuICAgICAgICAgICAgICAgIHZhciB1c2VycyA9IF8ucGx1Y2soXy5maWx0ZXIoZ3JvdXAubWVtYmVycywgbm9uRmFjQW5kQWN0aXZlKSwgJ3VzZXJJZCcpO1xuICAgICAgICAgICAgICAgIHJldHVybiB1c2VyQXBpLmdldCh7IGlkOiB1c2VycyB9KTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHJldHVybiBsb2FkR3JvdXBNZW1iZXJzKClcbiAgICAgICAgICAgICAgICAudGhlbihsb2FkVXNlcnNJbmZvKVxuICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGdldEdyb3VwVXNlcnMoKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHVzZXJzKSB7XG4gICAgICAgICAgICAgICAgdXNlcnMgPSBfLm1hcCh1c2VycywgZnVuY3Rpb24gKHUpIHsgcmV0dXJuIF8uZXh0ZW5kKHUsIHsgZ3JvdXBJZDogZ3JvdXBJZCB9KTsgfSk7XG4gICAgICAgICAgICAgICAgbWUuc2V0KHVzZXJzKTtcbiAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZSh1c2Vycyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1vZGVsJyk7XG52YXIgX19zdXBlciA9IEJhc2UucHJvdG90eXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG5cbiAgICBkZWZhdWx0czoge1xuICAgICAgICB1c2VyczogbnVsbCxcbiAgICAgICAgbW9kZWw6ICdtb2RlbC5lcW4nXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX19zdXBlci5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgdGhpcy5fZGF0YS51c2VycyA9IHRoaXMuX2RhdGEudXNlcnMgfHwgW107XG5cbiAgICAgICAgdGhpcy5fd29ybGRBcGkgPSBzZXJ2aWNlTG9jYXRvci53b3JsZEFwaSgpO1xuXG4gICAgICAgIHZhciBpZCA9IHRoaXMuZ2V0KCdpZCcpO1xuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmxkQXBpLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkVXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdmFyIHVzZXJzID0gdGhpcy5nZXQoJ3VzZXJzJyk7XG4gICAgICAgIHVzZXJzLnB1c2godXNlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZSgpO1xuICAgIH0sXG5cbiAgICByZW1vdmVVc2VyOiBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB2YXIgaWQgPSB0aGlzLmdldCgnaWQnKTtcbiAgICAgICAgdmFyIGNoZWNrV29ybGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZ2V0KCd1c2VycycpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmxkQXBpLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSkuZGVsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICBfLnJlbW92ZSh0aGlzLmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiB1LmdldCgnaWQnKSA9PT0gdXNlci5nZXQoJ2lkJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl93b3JsZEFwaVxuICAgICAgICAgICAgLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSlcbiAgICAgICAgICAgIC5yZW1vdmVVc2VyKHsgdXNlcklkOiB1c2VyLmdldCgnaWQnKSB9KVxuICAgICAgICAgICAgLnRoZW4oY2hlY2tXb3JsZCk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgdmFyIG1hcFVzZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMuZ2V0KCd1c2VycycpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSB7IHVzZXJJZDogdS5nZXQoJ2lkJykgfTtcbiAgICAgICAgICAgICAgICB2YXIgcm9sZSA9IHUuZ2V0KCdyb2xlJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAocm9sZSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucm9sZSA9IHJvbGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdmFyIGNyZWF0ZVdvcmxkID0gXy5wYXJ0aWFsKHRoaXMuX3dvcmxkQXBpLmNyZWF0ZSwgdGhpcy5waWNrKFsnbW9kZWwnLCAnbmFtZScsICdtaW5Vc2VycyddKSk7XG4gICAgICAgIHZhciBhZGRVc2VycyA9IF8ucGFydGlhbChtZS5fd29ybGRBcGkuYWRkVXNlcnMsIG1hcFVzZXJzKCksIHsgZmlsdGVyOiBtZS5nZXQoJ2lkJykgfSk7XG4gICAgICAgIHZhciBzYXZlZFVzZXJzID0gdGhpcy5nZXQoJ3VzZXJzJyk7XG4gICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcbiAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gY3JlYXRlIHRoZSB3b3JsZCBpbiB0aGUgQVBJIGFuZCB0aGVuIGFkZCB0aGUgdXNlcnNcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVXb3JsZCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIG1lLnNldCh3b3JsZCk7XG4gICAgICAgICAgICAgICAgICAgIG1lLl93b3JsZEFwaS51cGRhdGVDb25maWcoeyBmaWx0ZXI6IHdvcmxkLmlkIH0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oYWRkVXNlcnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHVzZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbmNlIHdlIHJlLXNldCB0aGUgd29ybGQsIHJlLXNldCB0aGUgdXNlcnNcbiAgICAgICAgICAgICAgICAgICAgbWUuc2V0KCd1c2VycycsIHNhdmVkVXNlcnMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhlIHdvcmxkIGlzIGFscmVhZHkgY3JlYXRlZCBqdXN0IGFkZCB0aGUgdXNlcnNcbiAgICAgICAgICAgIHJldHVybiBhZGRVc2VycygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGlzTmV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5nZXQoJ2xhc3RNb2RpZmllZCcpO1xuICAgIH1cblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL3dvcmxkLW1vZGVsJyk7XG52YXIgVXNlck1vZGVsID0gcmVxdWlyZSgnLi91c2VyLW1vZGVsJyk7XG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1jb2xsZWN0aW9uJyk7XG52YXIgX19zdXBlciA9IEJhc2UucHJvdG90eXBlO1xuXG52YXIgZG9uZUZuID0gZnVuY3Rpb24gKGR0ZCwgYWZ0ZXIpIHtcbiAgICByZXR1cm4gXy5hZnRlcihhZnRlciwgZHRkLnJlc29sdmUpO1xufTtcblxudmFyIHdvcmxkQXBpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgbW9kZWw6IE1vZGVsLFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBfX3N1cGVyLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgd29ybGRBcGkgPSBzZXJ2aWNlTG9jYXRvci53b3JsZEFwaSgpO1xuICAgIH0sXG5cbiAgICBhdXRvQXNzaWduQWxsOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gd29ybGRBcGkuYXV0b0Fzc2lnbihvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQodGhpcy5wYXJzZSh3b3JsZHMpKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIGdldEluY29tcGxldGVXb3JsZHNDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24gKHcpIHtcbiAgICAgICAgICAgIHJldHVybiAhdy5nZXQoJ2NvbXBsZXRlJyk7XG4gICAgICAgIH0pLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgdXBkYXRlVXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdmFyIHdvcmxkTmFtZSA9IHVzZXIuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgcHJldldvcmxkID0gdGhpcy5nZXRXb3JsZEJ5VXNlcih1c2VyKTtcbiAgICAgICAgdmFyIGN1cldvcmxkID0gdGhpcy5nZXRPckNyZWF0ZVdvcmxkKHdvcmxkTmFtZSk7XG4gICAgICAgIHZhciBkb25lID0gZG9uZUZuKGR0ZCwgMSk7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUncyBhbnl0aGluZyB0byBkb1xuICAgICAgICBpZiAoIXByZXZXb3JsZCAmJiAhY3VyV29ybGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkdGQucmVzb2x2ZSgpLnByb21pc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmV2V29ybGQpIHtcbiAgICAgICAgICAgIHByZXZXb3JsZC5yZW1vdmVVc2VyKHVzZXIpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyV29ybGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJXb3JsZC5hZGRVc2VyKHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihkb25lKTtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJXb3JsZCkge1xuICAgICAgICAgICAgY3VyV29ybGQuYWRkVXNlcih1c2VyKVxuICAgICAgICAgICAgICAgIC50aGVuKGRvbmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIGdldE9yQ3JlYXRlV29ybGQ6IGZ1bmN0aW9uICh3b3JsZE5hbWUpIHtcbiAgICAgICAgaWYgKCF3b3JsZE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JsZCA9IHRoaXMuZ2V0V29yZEJ5TmFtZSh3b3JsZE5hbWUpO1xuXG4gICAgICAgIGlmICghd29ybGQpIHtcbiAgICAgICAgICAgIHdvcmxkID0gdGhpcy5jcmVhdGUoeyBuYW1lOiB3b3JsZE5hbWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIGdldFdvcmRCeU5hbWU6IGZ1bmN0aW9uICh3b3JsZE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5nZXQoJ25hbWUnKSA9PT0gd29ybGROYW1lO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0V29ybGRCeVVzZXI6IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIGlmICghdXNlci5nZXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZ2V0V29ybGRCeVVzZXIgZXhwZWN0ZXMgYSBtb2RlbCAoJyArIHVzZXIgKyAnKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGlkID0gdXNlci5nZXQoJ2lkJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFdvcmxkQnlVc2VySWQoaWQpO1xuICAgIH0sXG5cbiAgICBnZXRXb3JsZEJ5VXNlcklkOiBmdW5jdGlvbiAodXNlcklkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5maW5kKHdvcmxkLmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdS5nZXQoJ2lkJykgPT09IHVzZXJJZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0V29ybGROYW1lczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVjaygnbmFtZScpO1xuICAgIH0sXG5cbiAgICBnZXROZXh0V29ybGROYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYWQgPSBmdW5jdGlvbiAobnVtLCBwbGFjZXMpIHtcbiAgICAgICAgICAgIHZhciB6ZXJvcyA9ICcwMDAwMDAwMDAwMDAwMDAwMDAnO1xuICAgICAgICAgICAgdmFyIGRpZ2l0cyA9IG51bS50b1N0cmluZygpLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBuZWVkZWQgPSBwbGFjZXMgLSBkaWdpdHM7XG4gICAgICAgICAgICByZXR1cm4gemVyb3Muc3Vic3RyKDAsIG5lZWRlZCkgKyBudW07XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHdvcmxkcyA9IHRoaXMuZ2V0V29ybGROYW1lcygpO1xuXG4gICAgICAgIGlmICghd29ybGRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuICdXb3JsZDAwMSc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvcGVyTmFtZXMgPSBfLmZpbHRlcih3b3JsZHMsIGZ1bmN0aW9uICh3KSB7IHJldHVybiAoL1dvcmxkXFxkXFxkXFxkLykudGVzdCh3KTsgfSkuc29ydCgpO1xuICAgICAgICB2YXIgbGFzdFdvcmxkID0gcHJvcGVyTmFtZXNbcHJvcGVyTmFtZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBudW1Xb3JsZCA9ICtsYXN0V29ybGQubWF0Y2goL1dvcmxkKFxcZFxcZFxcZCkvKVsxXTtcbiAgICAgICAgdmFyIHBsYWNlc1RvUGFkID0gMztcbiAgICAgICAgcmV0dXJuICdXb3JsZCcgKyBwYWQobnVtV29ybGQgKyAxLCBwbGFjZXNUb1BhZCk7XG4gICAgfSxcblxuICAgIHNldFVzZXJzQ29sbGVjdGlvbjogZnVuY3Rpb24gKHVzZXJzQ29sbGVjdGlvbikge1xuICAgICAgICB0aGlzLnVzZXJzQ29sbGVjdGlvbiA9IHVzZXJzQ29sbGVjdGlvbjtcbiAgICB9LFxuXG4gICAgam9pblVzZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1c2Vyc0hhc2ggPSB7fTtcbiAgICAgICAgdmFyIHVzZXJzQ29sbGVjdGlvbiA9IHRoaXMudXNlcnNDb2xsZWN0aW9uO1xuICAgICAgICB1c2Vyc0NvbGxlY3Rpb24uZWFjaChmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgdS5zZXQoeyBpc1dvcmxkQ29tcGxldGU6IHRydWUgfSk7XG4gICAgICAgICAgICByZXR1cm4gKHVzZXJzSGFzaFt1LmdldCgnaWQnKV0gPSB1KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICh3LCBpKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHcuZ2V0KCduYW1lJyk7XG4gICAgICAgICAgICB2YXIgaXNDb21wbGV0ZSA9IHcuZ2V0KCdjb21wbGV0ZScpO1xuICAgICAgICAgICAgdy5zZXQoeyBpbmRleDogaSwgbmFtZTogbmFtZSB8fCAoaSArIDEpICsgJycgfSk7XG4gICAgICAgICAgICBfLmVhY2gody5nZXQoJ3VzZXJzJyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJzSGFzaFt1LmdldCgndXNlcklkJyldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJzSGFzaFt1LmdldCgndXNlcklkJyldLnNldCh7IHdvcmxkOiBuYW1lLCByb2xlOiB1LmdldCgncm9sZScpLCBpc1dvcmxkQ29tcGxldGU6IGlzQ29tcGxldGUgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHVzZXJzQ29sbGVjdGlvbi5zb3J0KCk7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB3b3JsZEFwaS5saXN0KClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KHRoaXMucGFyc2Uod29ybGRzKSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBwYXJzZTogZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICBpZiAod29ybGRzLmxlbmd0aCkge1xuICAgICAgICAgICAgd29ybGRzID0gXy5tYXAod29ybGRzLCBmdW5jdGlvbiAodykge1xuICAgICAgICAgICAgICAgIHZhciB1c2VycyA9IF8ubWFwKHcudXNlcnMsIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSB3b3JsZCBhcGkgdXNlcnMgSWRzIGNvbWVzIGFzIHVzZXJJZFxuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UgYWRkIGl0IGFzIGlkIHNvIHdlIGNhbiB1c2UgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhbWUgY29kZSB0byBhY2Nlc3MgbW9kZWxzIHRoYXQgY29tZSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBtZW1iZXIvbG9jYWwgYXBpIGFzIHdpdGggdGhlIHdvcmxkIGFwaVxuICAgICAgICAgICAgICAgICAgICB1LmlkID0gdS51c2VySWQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVXNlck1vZGVsKHUpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdy51c2VycyA9IHVzZXJzO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3b3JsZHM7XG4gICAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBVdGlsaXR5IGNsYXNzIHRvIG1ha2UgYWpheCBjYWxscyBzZXF1ZW5jaWFsXG4qL1xuZnVuY3Rpb24gQWpheFF1ZXVlICgpIHtcbiAgICB0aGlzLnF1ZXVlID0gW107XG59XG5cbiQuZXh0ZW5kKEFqYXhRdWV1ZS5wcm90b3R5cGUsIHtcbiAgICBhZGQ6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5wdXNoKGZuKTtcbiAgICB9LFxuXG4gICAgZXhlY3V0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIG1lID0gdGhpcztcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcblxuICAgICAgICBmdW5jdGlvbiBuZXh0ICgpIHtcbiAgICAgICAgICAgIGlmIChtZS5xdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZm4gPSBtZS5xdWV1ZS5zaGlmdCgpO1xuXG4gICAgICAgICAgICAgICAgZm4uY2FsbChjb250ZXh0KVxuICAgICAgICAgICAgICAgICAgICAudGhlbihuZXh0KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkdGQucmVqZWN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZHRkLnJlc29sdmUoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIG5leHQoKTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9XG59KTtcblxuXG5tb2R1bGUuZXhwb3J0cyA9IEFqYXhRdWV1ZTsiLCIvKipcbi8qIEluaGVyaXQgZnJvbSBhIGNsYXNzICh1c2luZyBwcm90b3R5cGUgYm9ycm93aW5nKVxuKi9cbid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gaW5oZXJpdCAoQywgUCkge1xuICAgIHZhciBGID0gZnVuY3Rpb24gKCkge307XG4gICAgRi5wcm90b3R5cGUgPSBQLnByb3RvdHlwZTtcbiAgICBDLnByb3RvdHlwZSA9IG5ldyBGKCk7XG4gICAgQy5fX3N1cGVyID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBDO1xufVxuXG4vKipcbiogU2hhbGxvdyBjb3B5IG9mIGFuIG9iamVjdFxuKiBAcGFyYW0ge09iamVjdH0gZGVzdCBvYmplY3QgdG8gZXh0ZW5kXG4qIEByZXR1cm4ge09iamVjdH0gZXh0ZW5kZWQgb2JqZWN0XG4qL1xudmFyIGV4dGVuZCA9IGZ1bmN0aW9uIChkZXN0IC8qLCB2YXJfYXJncyovKSB7XG4gICAgdmFyIG9iaiA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgdmFyIGN1cnJlbnQ7XG4gICAgZm9yICh2YXIgaiA9IDA7IGogPCBvYmoubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCEoY3VycmVudCA9IG9ialtqXSkpIHsgLy9lc2xpbnQtZGlzYWJsZS1saW5lXG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGRvIG5vdCB3cmFwIGlubmVyIGluIGRlc3QuaGFzT3duUHJvcGVydHkgb3IgYmFkIHRoaW5ncyB3aWxsIGhhcHBlblxuICAgICAgICBmb3IgKHZhciBrZXkgaW4gY3VycmVudCkgeyAvL2VzbGludC1kaXNhYmxlLWxpbmVcbiAgICAgICAgICAgIGRlc3Rba2V5XSA9IGN1cnJlbnRba2V5XTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkZXN0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoYmFzZSwgcHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gICAgdmFyIHBhcmVudCA9IGJhc2U7XG4gICAgdmFyIGNoaWxkO1xuXG4gICAgY2hpbGQgPSBwcm9wcyAmJiBwcm9wcy5oYXNPd25Qcm9wZXJ0eSgnY29uc3RydWN0b3InKSA/IHByb3BzLmNvbnN0cnVjdG9yIDogZnVuY3Rpb24gKCkgeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG5cbiAgICAvLyBhZGQgc3RhdGljIHByb3BlcnRpZXMgdG8gdGhlIGNoaWxkIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgZXh0ZW5kKGNoaWxkLCBwYXJlbnQsIHN0YXRpY1Byb3BzKTtcblxuICAgIC8vIGFzc29jaWF0ZSBwcm90b3R5cGUgY2hhaW5cbiAgICBpbmhlcml0KGNoaWxkLCBwYXJlbnQpO1xuXG4gICAgLy8gYWRkIGluc3RhbmNlIHByb3BlcnRpZXNcbiAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvcHMpO1xuICAgIH1cblxuICAgIC8vIGRvbmVcbiAgICByZXR1cm4gY2hpbGQ7XG59O1xuIl19
