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
        var _this = this;
        this.updateData();
        this.worlds
            .updateUser(this.model)
            .then(function () {
                _this.removeEditMode();
                _this.$el.trigger('update', _this);
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
        var _this = this;
        this.$('[data-field]').each(function () {
            var el = $(this);
            var field = el.data('field');
            var val = el.val();

            _this.model.set(field, val);
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
            .done(this._hideUpdating)
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
        var incolpleteWorlds = this.worlds.getIncompleteWorldsCount();
        var unassignedUsers = this.users.getUnassignedUsersCount();
        var totalWorlds = this.worlds.size();

        var usersText = unassignedUsers ? unassignedUsers === 1 ? '1 user needs assignment.' : unassignedUsers + ' users need assignment.' : 'All users have been assigned.';
        var worldsText = !totalWorlds ? 'No worlds have been created.' : !incolpleteWorlds ? 'All worlds are complete.' : incolpleteWorlds === 1 ? '1 incomplete world needs attention.' : incolpleteWorlds + ' incomplete worlds need attention.';

        this.$('#users-status .text').text(usersText);
        this.$('#worlds-status .text').text(worldsText);

        if (unassignedUsers) {
            this.$('#users-status').addClass('incomplete');
        } else {
            this.$('#users-status').removeClass('incomplete');
        }

        if (incolpleteWorlds || !totalWorlds) {
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

        this.sort.call(this);

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

        if (key == null) {
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
})();

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
        var _this = this;
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
                _this.set(users);
                dtd.resolve(users, _this);
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
        var _this = this;
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
        var addUsers = _.partial(_this._worldApi.addUsers, mapUsers(), { filter: _this.get('id') });
        var savedUsers = this.get('users');
        if (this.isNew()) {
            // we need to create the world in the API and then add the users
            return createWorld()
                .then(function (world) {
                    _this.set(world);
                    _this._worldApi.updateConfig({ filter: world.id });
                })
                .then(addUsers)
                .then(function (users) {
                    // since we re-set the world, re-set the users
                    _this.set('users', savedUsers);
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

        var properNames = _.filter(worlds, function (w) { return /World\d\d\d/.test(w); }).sort();
        var lastWorld = properNames[properNames.length - 1];
        var numWorld = +lastWorld.match(/World(\d\d\d)/)[1];
        return 'World' + pad(numWorld + 1, 3);
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
        var _this = this;
        context = context || this;

        function next() {
            if (_this.queue.length) {
                var fn = _this.queue.shift();

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
*/
var extend = function (dest /*, var_args*/) {
    var obj = Array.prototype.slice.call(arguments, 1);
    var current;
    for (var j = 0; j<obj.length; j++) {
        if (!(current = obj[j])) {
            continue;
        }

        // do not wrap inner in dest.hasOwnProperty or bad things will happen
        /*jshint -W089 */
        for (var key in current) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Fzc2lnbm1lbnQtcm93LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9hc3NpZ25tZW50LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9iYXNlLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Jhc2UtbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2RlZmF1bHRzLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9pbmRleC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvcHJvamVjdC1tb2RlbC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvc2VydmljZS1sb2NhdG9yLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy90ZW1wbGF0ZXMuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXItbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXJzLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3dvcmxkLW1vZGVsLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy93b3JsZHMtY29sbGVjdGlvbi5qcyIsInNyYy91dGlsL2FqYXgtcXVldWUuanMiLCJzcmMvdXRpbC9pbmhlcml0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIndXNlIHN0cmljdCc7XG5cbnZhciB0ZW1wbGF0ZXMgPSByZXF1aXJlKCcuL3RlbXBsYXRlcycpO1xuXG52YXIgQXNzaWdubWVudFJvdyA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgdGhpcy4kZWwgPSAkKCc8dHI+Jyk7XG4gICAgdGhpcy5lbCA9IHRoaXMuJGVsWzBdO1xuICAgIHRoaXMuJCA9IF8ucGFydGlhbFJpZ2h0KCQsIHRoaXMuJGVsKTtcblxuICAgIHRoaXMubW9kZWwgPSBvcHRpb25zLm1vZGVsO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy53b3JsZHMgPSBvcHRpb25zLndvcmxkcztcbiAgICB0aGlzLnByb2plY3QgPSBvcHRpb25zLnByb2plY3Q7XG5cbiAgICBfLmJpbmRBbGwodGhpcywgWydzZXRFZGl0TW9kZScsICdyZW1vdmVFZGl0TW9kZScsICdzYXZlRWRpdCcsICdjYW5jZWxFZGl0JywgJ3VwZGF0ZURhdGEnXSk7XG5cbiAgICB0aGlzLmJpbmRFdmVudHMoKTtcblxufTtcblxuXy5leHRlbmQoQXNzaWdubWVudFJvdy5wcm90b3R5cGUsIHtcblxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZXNbJ3VzZXItcm93J10sXG5cbiAgICBlZGl0VGVtcGxhdGU6IHRlbXBsYXRlc1snZWRpdC11c2VyLXJvdyddLFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnYnV0dG9uLmVkaXQnLCB0aGlzLnNldEVkaXRNb2RlKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJ2J1dHRvbi5zYXZlJywgdGhpcy5zYXZlRWRpdCk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICdidXR0b24uY2FuY2VsJywgdGhpcy5jYW5jZWxFZGl0KTtcbiAgICB9LFxuXG4gICAgcmVtb3ZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLm9mZignY2xpY2snLCBudWxsLCBudWxsKTtcbiAgICAgICAgLy8gdGhpcyBvbmx5IGdpdmVzIGEgZGVsYXkgdG8gcmVtb3ZlIHRoZSB0clxuICAgICAgICAvLyBhbmltYXRpb24gb2YgaGVpZ2h0IG9mIHRoZSB0ciBkb2VzIG5vdCB3b3JrXG4gICAgICAgIHRoaXMuJCgnOmNoZWNrYm94JykuYXR0cignY2hlY2tlZCcsIGZhbHNlKTtcbiAgICAgICAgdGhpcy4kZWxcbiAgICAgICAgICAgIC5jc3MoeyBvcGFjaXR5OiAwLjMgfSlcbiAgICAgICAgICAgIC5hbmltYXRlKHsgaGVpZ2h0OiAwIH0sIHtcbiAgICAgICAgICAgICAgICBkdXJhdGlvbjogMzAwLFxuICAgICAgICAgICAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIG1ha2VJbmFjdGl2ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tb2RlbC5tYWtlSW5hY3RpdmUoKTtcbiAgICB9LFxuXG4gICAgc2V0RWRpdE1vZGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tb2RlbC5zZXQoJ2VkaXQtbW9kZScsIHRydWUpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICByZW1vdmVFZGl0TW9kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCgnZWRpdC1tb2RlJywgZmFsc2UpO1xuICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgIH0sXG5cbiAgICBzYXZlRWRpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLnVwZGF0ZURhdGEoKTtcbiAgICAgICAgdGhpcy53b3JsZHNcbiAgICAgICAgICAgIC51cGRhdGVVc2VyKHRoaXMubW9kZWwpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgX3RoaXMucmVtb3ZlRWRpdE1vZGUoKTtcbiAgICAgICAgICAgICAgICBfdGhpcy4kZWwudHJpZ2dlcigndXBkYXRlJywgX3RoaXMpO1xuICAgICAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNhbmNlbEVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5yZW1vdmVFZGl0TW9kZSgpO1xuICAgIH0sXG5cbiAgICByZW5kZXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHRlbXBsID0gdGhpcy5tb2RlbC5nZXQoJ2VkaXQtbW9kZScpID8gdGhpcy5lZGl0VGVtcGxhdGUgOiB0aGlzLnRlbXBsYXRlO1xuICAgICAgICB2YXIgdm0gPSBfLmV4dGVuZCh7XG4gICAgICAgICAgICByb2xlczogdGhpcy5wcm9qZWN0LmdldCgncm9sZXMnKSxcbiAgICAgICAgICAgIG9wdGlvbmFsUm9sZXM6IHRoaXMucHJvamVjdC5nZXQoJ29wdGlvbmFsUm9sZXMnKSxcbiAgICAgICAgICAgIHdvcmxkczogdGhpcy53b3JsZHMuZ2V0V29ybGROYW1lcygpLFxuICAgICAgICAgICAgbmV3V29ybGQ6IHRoaXMud29ybGRzLmdldE5leHRXb3JsZE5hbWUoKVxuICAgICAgICB9LCB0aGlzLm1vZGVsLnRvSlNPTigpKTtcblxuICAgICAgICB0aGlzLiRlbC5odG1sKHRlbXBsKHZtKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHVwZGF0ZURhdGE6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdGhpcy4kKCdbZGF0YS1maWVsZF0nKS5lYWNoKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBlbCA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgZmllbGQgPSBlbC5kYXRhKCdmaWVsZCcpO1xuICAgICAgICAgICAgdmFyIHZhbCA9IGVsLnZhbCgpO1xuXG4gICAgICAgICAgICBfdGhpcy5tb2RlbC5zZXQoZmllbGQsIHZhbCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQXNzaWdubWVudFJvdzsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBVc2Vyc0NvbGxlY3Rpb24gPSByZXF1aXJlKCcuL3VzZXJzLWNvbGxlY3Rpb24nKTtcbnZhciBXb3JsZHNDb2xsZWN0aW9uID0gcmVxdWlyZSgnLi93b3JsZHMtY29sbGVjdGlvbicpO1xudmFyIFByb2plY3RNb2RlbCA9IHJlcXVpcmUoJy4vcHJvamVjdC1tb2RlbCcpO1xudmFyIEFzc2lnbmVtbnRSb3cgPSByZXF1aXJlKCcuL2Fzc2lnbm1lbnQtcm93Jyk7XG52YXIgZW52ID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpO1xudmFyIEFqYXhRdWV1ZSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvYWpheC1xdWV1ZScpO1xuXG5mdW5jdGlvbiBzZXRFbnZpcm9ubWVudChvcHRpb25zKSB7XG4gICAgZW52LnNldChfLm9taXQob3B0aW9ucywgJ2VsJykpO1xufVxuXG52YXIgQXNzaWdubWVudCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgc2V0RW52aXJvbm1lbnQob3B0aW9ucyk7XG4gICAgdGhpcy5pbml0aWFsaXplKG9wdGlvbnMpO1xufTtcblxuQXNzaWdubWVudC5wcm90b3R5cGUgPSB7XG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICB0aGlzLmVsID0gdHlwZW9mIG9wdGlvbnMuZWwgPT09ICdzdHJpbmcnID8gJChvcHRpb25zLmVsKVswXSA6IG9wdGlvbnMuZWw7XG4gICAgICAgIHRoaXMuJGVsID0gJCh0aGlzLmVsKTtcbiAgICAgICAgdGhpcy4kID0gXy5wYXJ0aWFsUmlnaHQoJCwgdGhpcy5lbCk7XG5cbiAgICAgICAgdGhpcy51c2VycyA9IG5ldyBVc2Vyc0NvbGxlY3Rpb24oKTtcbiAgICAgICAgdGhpcy53b3JsZHMgPSBuZXcgV29ybGRzQ29sbGVjdGlvbigpO1xuICAgICAgICB0aGlzLnByb2plY3QgPSBuZXcgUHJvamVjdE1vZGVsKCk7XG5cbiAgICAgICAgXy5iaW5kQWxsKHRoaXMsIFsncmVuZGVyJywgJ3JlbmRlclRhYmxlJywgJ3RvZ2dsZUNvbnRyb2xscycsICdzYXZlRWRpdCcsICdzZWxlY3RBbGwnLCAndXNhc3NpZ25TZWxlY3RlZCcsICdfc2hvd1VwZGF0aW5nJywgJ19oaWRlVXBkYXRpbmcnLCAnYXV0b0Fzc2lnbkFsbCcsICdtYWtlVXNlckluYWN0aXZlJ10pO1xuXG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLm9uKCd1cGRhdGUnLCAndHInLCB0aGlzLnNhdmVFZGl0KTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJ2lucHV0OmNoZWNrYm94Om5vdCgjc2VsZWN0LWFsbCknLCB0aGlzLnRvZ2dsZUNvbnRyb2xscyk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcjc2VsZWN0LWFsbCcsIHRoaXMuc2VsZWN0QWxsKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy51bmFzc2lnbi11c2VyJywgdGhpcy51c2Fzc2lnblNlbGVjdGVkKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJy5hdXRvLWFzc2lnbi1hbGwnLCB0aGlzLmF1dG9Bc3NpZ25BbGwpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLm1ha2UtdXNlci1pbmFjdGl2ZScsIHRoaXMubWFrZVVzZXJJbmFjdGl2ZSk7XG4gICAgfSxcblxuICAgIGxvYWQ6IGZ1bmN0aW9uICgpIHtcblxuICAgICAgICB2YXIgam9pbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMud29ybGRzLnNldFVzZXJzQ29sbGVjdGlvbih0aGlzLnVzZXJzKTtcbiAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgdGhpcy5yZW5kZXIoKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiAkLndoZW4oXG4gICAgICAgICAgICB0aGlzLndvcmxkcy5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy51c2Vycy5mZXRjaCgpLFxuICAgICAgICAgICAgdGhpcy5wcm9qZWN0LmZldGNoKClcbiAgICAgICAgKS50aGVuKGpvaW4pO1xuXG4gICAgfSxcblxuICAgIHNhdmVFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMud29ybGRzLmZldGNoKClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkcy5qb2luVXNlcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgICAgIHRoaXMudXBkYXRlQ29udHJvbHMoKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIGF1dG9Bc3NpZ25BbGw6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5fc2hvd1VwZGF0aW5nKCk7XG4gICAgICAgIHZhciBtYXhVc2VycyA9ICt0aGlzLiQoJyNtYXgtdXNlcnMnKS52YWwoKTtcbiAgICAgICAgcmV0dXJuIHRoaXMud29ybGRzLmF1dG9Bc3NpZ25BbGwoeyBtYXhVc2VyczogbWF4VXNlcnMgfSlcbiAgICAgICAgICAgIC5kb25lKHRoaXMuX2hpZGVVcGRhdGluZylcbiAgICAgICAgICAgIC5mYWlsKHRoaXMuX2hpZGVVcGRhdGluZylcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkcy5qb2luVXNlcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0U2VsZWN0ZWRJZHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuJCgndGJvZHkgOmNoZWNrYm94OmNoZWNrZWQnKS5tYXAoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICQodGhpcykuZGF0YSgnaWQnKTtcbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGZpbmRSb3dWaWV3czogZnVuY3Rpb24gKGlkcykge1xuICAgICAgICByZXR1cm4gXy5tYXAoaWRzLCBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnJvd1ZpZXdzW2lkXTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgfSxcblxuICAgIHVuYXNzaWduVXNlcnM6IGZ1bmN0aW9uIChpZHMpIHtcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBkdGQucmVzb2x2ZSgpO1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIGZvciBub3cgd2UgbmVlZCB0byBzZXF1ZW5jZSB0aGUgY2FsbHMgdG8gdW5hc3NpZ24gdXNlcnMgZnJvbSB3b3JsZHNcbiAgICAgICAgdmFyIHF1ZXVlID0gbmV3IEFqYXhRdWV1ZSgpO1xuXG4gICAgICAgIF8uZWFjaChpZHMsIGZ1bmN0aW9uICh1c2VySWQpIHtcbiAgICAgICAgICAgIHZhciB1c2VyID0gdGhpcy51c2Vycy5nZXRCeUlkKHVzZXJJZCk7XG4gICAgICAgICAgICB1c2VyLnNldCgnd29ybGQnLCAnJyk7XG4gICAgICAgICAgICB1c2VyLnNldCgncm9sZScsICcnKTtcbiAgICAgICAgICAgIHF1ZXVlLmFkZChfLnBhcnRpYWwoXy5iaW5kKHRoaXMud29ybGRzLnVwZGF0ZVVzZXIsIHRoaXMud29ybGRzKSwgdXNlcikpO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICBxdWV1ZS5leGVjdXRlKHRoaXMpLnRoZW4oZG9uZSk7XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIHVzYXNzaWduU2VsZWN0ZWQ6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgaWRzID0gdGhpcy5nZXRTZWxlY3RlZElkcygpO1xuXG4gICAgICAgIHZhciBkb25lID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53b3JsZHMuZmV0Y2goKS50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLndvcmxkcy5qb2luVXNlcnMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9oaWRlVXBkYXRpbmcoKTtcbiAgICAgICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuXG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdGhpcy5fc2hvd1VwZGF0aW5nKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudW5hc3NpZ25Vc2VycyhpZHMpLnRoZW4oZG9uZSk7XG4gICAgfSxcblxuICAgIG1ha2VVc2VySW5hY3RpdmU6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGlkcyA9IHRoaXMuZ2V0U2VsZWN0ZWRJZHMoKTtcbiAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLnRvZ2dsZUNvbnRyb2xscygpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdmFyIG1ha2VVc2Vyc0luYWN0aXZlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIHJvd3MgPSB0aGlzLmZpbmRSb3dWaWV3cyhpZHMpO1xuICAgICAgICAgICAgLy8gZm9yIG5vdyB3ZSBuZWVkIHRvIHNlcXVlbmNlIHRoZSBjYWxscyB0byBwYXRjaCB0aGUgdXNlcnNcbiAgICAgICAgICAgIC8vIHNpbmNlIHRoZSBBUEkgY2FuIG9ubHkgb3BlcmF0ZSBvbiBvbmUgY2FsbCBwZXIgZ3JvdXAgYXQgYSB0aW1lXG4gICAgICAgICAgICB2YXIgcXVldWUgPSBuZXcgQWpheFF1ZXVlKCk7XG4gICAgICAgICAgICBfLmVhY2gocm93cywgZnVuY3Rpb24gKHZpZXcpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXNlciA9IHZpZXcubW9kZWw7XG4gICAgICAgICAgICAgICAgcXVldWUuYWRkKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHZpZXcubWFrZUluYWN0aXZlKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZpZXcucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgICAgICBxdWV1ZS5leGVjdXRlKHRoaXMpLnRoZW4oZG9uZSk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gdGhpcy51bmFzc2lnblVzZXJzKGlkcylcbiAgICAgICAgICAgIC50aGVuKG1ha2VVc2Vyc0luYWN0aXZlKTtcblxuXG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiQoJ3RhYmxlIHRib2R5JykuZW1wdHkoKTtcbiAgICAgICAgdGhpcy5yZW5kZXJUYWJsZSgpO1xuICAgICAgICB0aGlzLnRvZ2dsZUNvbnRyb2xscygpO1xuICAgIH0sXG5cbiAgICByZW5kZXJUYWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJvd1ZpZXdzID0ge307XG4gICAgICAgIHZhciByb3dzID0gW107XG4gICAgICAgIHRoaXMudXNlcnMuZWFjaChmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgdmFyIHZpZXcgPSBuZXcgQXNzaWduZW1udFJvdyh7IG1vZGVsOiB1LCB3b3JsZHM6IHRoaXMud29ybGRzLCBwcm9qZWN0OiB0aGlzLnByb2plY3QgfSk7XG4gICAgICAgICAgICB0aGlzLnJvd1ZpZXdzW3UuZ2V0KCdpZCcpXSA9IHZpZXc7XG4gICAgICAgICAgICByb3dzLnB1c2godmlldy5yZW5kZXIoKS5lbCk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuJCgndGFibGUgdGJvZHknKS5hcHBlbmQocm93cyk7XG4gICAgfSxcblxuXG4gICAgdXBkYXRlQ29udHJvbHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9sc0ZvclNlbGVjdGlvbigpO1xuICAgICAgICB0aGlzLnVwZGF0ZUF1dG9Bc3NpZ25CdXR0b24oKTtcbiAgICAgICAgdGhpcy51cGRhdGVTdGF0dXMoKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBpbmNvbHBsZXRlV29ybGRzID0gdGhpcy53b3JsZHMuZ2V0SW5jb21wbGV0ZVdvcmxkc0NvdW50KCk7XG4gICAgICAgIHZhciB1bmFzc2lnbmVkVXNlcnMgPSB0aGlzLnVzZXJzLmdldFVuYXNzaWduZWRVc2Vyc0NvdW50KCk7XG4gICAgICAgIHZhciB0b3RhbFdvcmxkcyA9IHRoaXMud29ybGRzLnNpemUoKTtcblxuICAgICAgICB2YXIgdXNlcnNUZXh0ID0gdW5hc3NpZ25lZFVzZXJzID8gdW5hc3NpZ25lZFVzZXJzID09PSAxID8gJzEgdXNlciBuZWVkcyBhc3NpZ25tZW50LicgOiB1bmFzc2lnbmVkVXNlcnMgKyAnIHVzZXJzIG5lZWQgYXNzaWdubWVudC4nIDogJ0FsbCB1c2VycyBoYXZlIGJlZW4gYXNzaWduZWQuJztcbiAgICAgICAgdmFyIHdvcmxkc1RleHQgPSAhdG90YWxXb3JsZHMgPyAnTm8gd29ybGRzIGhhdmUgYmVlbiBjcmVhdGVkLicgOiAhaW5jb2xwbGV0ZVdvcmxkcyA/ICdBbGwgd29ybGRzIGFyZSBjb21wbGV0ZS4nIDogaW5jb2xwbGV0ZVdvcmxkcyA9PT0gMSA/ICcxIGluY29tcGxldGUgd29ybGQgbmVlZHMgYXR0ZW50aW9uLicgOiBpbmNvbHBsZXRlV29ybGRzICsgJyBpbmNvbXBsZXRlIHdvcmxkcyBuZWVkIGF0dGVudGlvbi4nO1xuXG4gICAgICAgIHRoaXMuJCgnI3VzZXJzLXN0YXR1cyAudGV4dCcpLnRleHQodXNlcnNUZXh0KTtcbiAgICAgICAgdGhpcy4kKCcjd29ybGRzLXN0YXR1cyAudGV4dCcpLnRleHQod29ybGRzVGV4dCk7XG5cbiAgICAgICAgaWYgKHVuYXNzaWduZWRVc2Vycykge1xuICAgICAgICAgICAgdGhpcy4kKCcjdXNlcnMtc3RhdHVzJykuYWRkQ2xhc3MoJ2luY29tcGxldGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3VzZXJzLXN0YXR1cycpLnJlbW92ZUNsYXNzKCdpbmNvbXBsZXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5jb2xwbGV0ZVdvcmxkcyB8fCAhdG90YWxXb3JsZHMpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3dvcmxkcy1zdGF0dXMnKS5hZGRDbGFzcygnaW5jb21wbGV0ZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcjd29ybGRzLXN0YXR1cycpLnJlbW92ZUNsYXNzKCdpbmNvbXBsZXRlJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLiQoJy5zdGF0dXMtd2lkZ2V0JykuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlQ29udHJvbHNGb3JTZWxlY3Rpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG51bVNlbGVjdGVkID0gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3g6Y2hlY2tlZCcpLmxlbmd0aDtcbiAgICAgICAgdGhpcy4kKCcuY29tcG9uZW50LmNvbnRyb2xzJylbbnVtU2VsZWN0ZWQgPyAnYWRkQ2xhc3MnIDogJ3JlbW92ZUNsYXNzJ10oJ3Zpc2libGUnKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlQXV0b0Fzc2lnbkJ1dHRvbjogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIGlmICh0aGlzLnByb2plY3QuaXNEeW5hbWljQXNzaWdubWVudCgpKSB7XG4gICAgICAgICAgICB2YXIgaGFzUm9sZXMgPSB0aGlzLnByb2plY3QuaGFzUm9sZXMoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5zaW5nbGUnKS5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuZHluYW1pYycpLnNob3coKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5keW5hbWljLW5vLXJvbGVzLXRleHQnKVtoYXNSb2xlcyA/ICdoaWRlJyA6ICdzaG93J10oKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5uby1yb2xlcycpW2hhc1JvbGVzID8gJ2hpZGUnIDogJ3Nob3cnXSgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLmR5bmFtaWMnKS5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuZHluYW1pYy1uby1yb2xlcy10ZXh0JykuaGlkZSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLnNpbmdsZScpLnNob3coKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5uby1yb2xlcycpLnNob3coKTtcblxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHRoaXMudXNlcnMuYWxsVXNlcnNBc3NpZ25lZCgpKSB7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scycpLnJlbW92ZUNsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scycpLmFkZENsYXNzKCd2aXNpYmxlJyk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc2VsZWN0QWxsOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveCcpLnByb3AoJ2NoZWNrZWQnLCBlLnRhcmdldC5jaGVja2VkKTtcbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9scygpO1xuICAgIH0sXG5cbiAgICB0b2dnbGVDb250cm9sbHM6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHZhciB0b3RhbCA9IHRoaXMuJCgndGJvZHkgOmNoZWNrYm94Jyk7XG4gICAgICAgIHZhciBjaGVja2VkID0gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3g6Y2hlY2tlZCcpO1xuXG4gICAgICAgIGlmICh0b3RhbC5sZW5ndGggPT09IGNoZWNrZWQubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyNzZWxlY3QtYWxsJykuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJyNzZWxlY3QtYWxsJykucmVtb3ZlQXR0cignY2hlY2tlZCcpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy51cGRhdGVDb250cm9scygpO1xuICAgIH0sXG5cbiAgICBfc2hvd1VwZGF0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLmNzcyh7IG9wYWNpdHk6IDAuNCB9KTtcbiAgICB9LFxuXG4gICAgX2hpZGVVcGRhdGluZzogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLiRlbC5jc3MoeyBvcGFjaXR5OiAxIH0pO1xuICAgIH1cblxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBBc3NpZ25tZW50OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIEJhc2VDb2xsZWN0aW9uID0gZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xuICAgIHRoaXMuX21vZGVscyA9IFtdO1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5fLmV4dGVuZChCYXNlQ29sbGVjdGlvbi5wcm90b3R5cGUsIHtcbiAgICBpZEF0dHJpYnV0ZTogJ2lkJyxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICB9LFxuXG4gICAgY3JlYXRlOiBmdW5jdGlvbiAoYXR0ciwgb3B0aW9ucykge1xuICAgICAgICB2YXIgbSA9IG5ldyB0aGlzLm1vZGVsKGF0dHIsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLnNldChtKTtcbiAgICAgICAgcmV0dXJuIG07XG4gICAgfSxcblxuICAgIHJlc2V0OiBmdW5jdGlvbiAobW9kZWxzLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuX21vZGVscy5sZW5ndGggPSAwO1xuICAgICAgICB0aGlzLnNldChtb2RlbHMpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICBfLnJlbW92ZSh0aGlzLl9tb2RlbHMsIGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gbSA9PT0gbW9kZWw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGRlbGV0ZSBtb2RlbC5jb2xsZWN0aW9uO1xuXG4gICAgICAgIHJldHVybiBtb2RlbDtcbiAgICB9LFxuXG4gICAgc2V0OiBmdW5jdGlvbiAobW9kZWxzKSB7XG4gICAgICAgIGlmICghbW9kZWxzKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBtb2RlbHMgPSBbXS5jb25jYXQobW9kZWxzKTtcblxuICAgICAgICBpZiAoIW1vZGVscy5sZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIF8uZWFjaChtb2RlbHMsIGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICBpZiAoIShtIGluc3RhbmNlb2YgdGhpcy5tb2RlbCkpIHtcbiAgICAgICAgICAgICAgICBtID0gbmV3IHRoaXMubW9kZWwobSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIG0uY29sbGVjdGlvbiA9IHRoaXM7XG5cbiAgICAgICAgICAgIHRoaXMuX21vZGVscy5wdXNoKG0pO1xuICAgICAgICB9LCB0aGlzKTtcblxuICAgICAgICB0aGlzLnNvcnQuY2FsbCh0aGlzKTtcblxuICAgICAgICByZXR1cm4gbW9kZWxzO1xuICAgIH0sXG5cbiAgICBzb3J0Rm46IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHJldHVybiBiLl9kYXRhW3RoaXMuaWRBdHRyaWJ1dGVdIC0gYS5fZGF0YVt0aGlzLmlkQXR0cmlidXRlXTtcbiAgICB9LFxuXG4gICAgc29ydDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9tb2RlbHMgPSB0aGlzLl9tb2RlbHMuc29ydCh0aGlzLnNvcnRGbi5iaW5kKHRoaXMpKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fbW9kZWxzO1xuICAgIH0sXG5cbiAgICBnZXRCeUlkOiBmdW5jdGlvbiAoaWQpIHtcbiAgICAgICAgcmV0dXJuIF8uZmluZCh0aGlzLl9tb2RlbHMsIGZ1bmN0aW9uIChtKSB7XG4gICAgICAgICAgICByZXR1cm4gbS5nZXQodGhpcy5pZEF0dHJpYnV0ZSkgPT09IGlkO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgZWFjaDogZnVuY3Rpb24gKGNiLCBjdHgpIHtcbiAgICAgICAgcmV0dXJuIF8uZWFjaCh0aGlzLl9tb2RlbHMsIGNiLCBjdHggfHwgdGhpcyk7XG4gICAgfSxcblxuICAgIGFsbDogZnVuY3Rpb24gKGNiLCBjdHgpIHtcbiAgICAgICAgcmV0dXJuIF8uYWxsKHRoaXMuX21vZGVscywgY2IsIGN0eCB8fCB0aGlzKTtcbiAgICB9LFxuXG4gICAgdG9KU09OOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBfLmludm9rZSh0aGlzLl9tb2RlbHMsICd0b0pTT04nKTtcbiAgICB9LFxuXG4gICAgZmluZDogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBfLmZpbmQodGhpcy5fbW9kZWxzLCBmbik7XG4gICAgfSxcblxuICAgIGZpbHRlcjogZnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIHJldHVybiBfLmZpbHRlcih0aGlzLl9tb2RlbHMsIGZuKTtcbiAgICB9LFxuXG4gICAgc2l6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fbW9kZWxzLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgbWFwOiBmdW5jdGlvbiAoZm4sIGN0eCkge1xuICAgICAgICByZXR1cm4gXy5tYXAodGhpcy5fbW9kZWxzLCBmdW5jdGlvbiAobW9kZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKGN0eCwgbW9kZWwudG9KU09OKCkpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgcGx1Y2s6IGZ1bmN0aW9uIChmaWVsZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiBtW2ZpZWxkXTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlQ29sbGVjdGlvbjsiLCIndXNlIHN0cmljdCc7XG5cblxudmFyIEJhc2VNb2RlbCA9IGZ1bmN0aW9uIChhdHRyLCBvcHRpb25zKSB7XG4gICAgYXR0ciA9IF8uZGVmYXVsdHMoe30sIGF0dHIsIF8ucmVzdWx0KHRoaXMsICdkZWZhdWx0cycpKTtcbiAgICB0aGlzLl9kYXRhID0ge307XG4gICAgdGhpcy5zZXQoYXR0ciwgb3B0aW9ucyk7XG4gICAgdGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG59O1xuXG5fLmV4dGVuZChCYXNlTW9kZWwucHJvdG90eXBlLCB7XG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKGF0dHIsIG9wdGlvbnMpIHtcblxuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uIChrZXksIHZhbCwgb3B0aW9ucykge1xuXG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYXR0cnM7XG4gICAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgYXR0cnMgPSBrZXk7XG4gICAgICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgICAgIH1cblxuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICAgICAgICBfLmV4dGVuZCh0aGlzLl9kYXRhLCBhdHRycyk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIGdldDogZnVuY3Rpb24gKGtleSwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YVtrZXldO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY29sbGVjdGlvbikge1xuICAgICAgICAgICAgdGhpcy5jb2xsZWN0aW9uLnJlbW92ZSh0aGlzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2RhdGE7XG4gICAgfSxcblxuICAgIHBpY2s6IGZ1bmN0aW9uIChrZXlzKSB7XG4gICAgICAgIHJldHVybiBfLnBpY2sodGhpcy5fZGF0YSwga2V5cyk7XG4gICAgfVxuXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBCYXNlTW9kZWw7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW52ID0ge1xuICAgIGFjY291bnQ6ICcnLFxuICAgIHByb2plY3Q6ICcnLFxuICAgIGdyb3VwOiAnJyxcbiAgICBncm91cElkOiAnJyxcbiAgICB0b2tlbjogJycsXG4gICAgc2VydmVyOiB7XG4gICAgICAgIGhvc3Q6ICdhcGkuZm9yaW8uY29tJyxcbiAgICAgICAgcHJvdG9jb2w6ICdodHRwcydcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzZXQ6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIGVudiA9IF8ubWVyZ2UoZW52LCBvcHRpb25zKTtcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBlbnY7XG4gICAgfVxufTsiLCIoZnVuY3Rpb24gKCkge1xuICAgICd1c2Ugc3RyaWN0JztcbiAgICB2YXIgQXBwID0gcmVxdWlyZSgnLi9hc3NpZ25tZW50LmpzJyk7XG5cbiAgICB3aW5kb3cuZm9yaW8gPSB3aW5kb3cuZm9yaW8gfHwge307XG4gICAgd2luZG93LmZvcmlvLk11bHRpcGxheWVyQXNzaWdubWVudENvbXBvbmVudCA9IEFwcDtcbn0pKCk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBzZXJ2aWNlTG9jYXRvciA9IHJlcXVpcmUoJy4vc2VydmljZS1sb2NhdG9yJyk7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1vZGVsJyk7XG4vLyB2YXIgX19zdXBlciA9IEJhc2UucHJvdG90eXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG5cbiAgICBpc0R5bmFtaWNBc3NpZ25tZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmdldCgnd29ybGRzJykgPT09ICdkeW5hbWljJztcbiAgICB9LFxuXG4gICAgaGFzUm9sZXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHJvbGVzID0gdGhpcy5nZXQoJ3JvbGVzJyk7XG4gICAgICAgIHJldHVybiByb2xlcyAmJiAhIXJvbGVzLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFwaSA9IHNlcnZpY2VMb2NhdG9yLndvcmxkQXBpKCk7XG5cbiAgICAgICAgcmV0dXJuIGFwaS5nZXRQcm9qZWN0U2V0dGluZ3MoKS50aGVuKGZ1bmN0aW9uIChzZXR0aW5ncykge1xuICAgICAgICAgICAgdGhpcy5zZXQoc2V0dGluZ3MpO1xuICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cbn0pOyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGVudiA9IHJlcXVpcmUoJy4vZGVmYXVsdHMuanMnKTtcblxudmFyIGNhY2hlID0ge307XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHdvcmxkQXBpOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY2FjaGUud29ybGRBcGkpIHtcbiAgICAgICAgICAgIGNhY2hlLndvcmxkQXBpID0gbmV3IEYuc2VydmljZS5Xb3JsZChlbnYuZ2V0KCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhY2hlLndvcmxkQXBpO1xuICAgIH0sXG5cbiAgICBtZW1iZXJBcGk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjYWNoZS5tZW1iZXJBcGkpIHtcbiAgICAgICAgICAgIGNhY2hlLm1lbWJlckFwaSA9IG5ldyBGLnNlcnZpY2UuTWVtYmVyKF8ucGljayhlbnYuZ2V0KCksIFsnZ3JvdXBJZCcsICdzZXJ2ZXInXSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGNhY2hlLm1lbWJlckFwaTtcbiAgICB9LFxuXG4gICAgdXNlckFwaTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNhY2hlLnVzZXJBcGkpIHtcbiAgICAgICAgICAgIGNhY2hlLnVzZXJBcGkgPSBuZXcgRi5zZXJ2aWNlLlVzZXIoXy5waWNrKGVudi5nZXQoKSwgWydhY2NvdW50JywgJ3NlcnZlciddKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FjaGUudXNlckFwaTtcbiAgICB9XG59OyIsImV4cG9ydHNbXCJlZGl0LXVzZXItcm93XCJdID0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZSwgX19qID0gQXJyYXkucHJvdG90eXBlLmpvaW47XG5mdW5jdGlvbiBwcmludCgpIHsgX19wICs9IF9fai5jYWxsKGFyZ3VtZW50cywgJycpIH1cbndpdGggKG9iaikge1xuX19wICs9ICc8dGQ+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNsYXNzPVwic2VsZWN0XCIgZGF0YS1pZD1cIicgK1xuKChfX3QgPSAoIGlkICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiPC90ZD5cXG48dGQ+PC90ZD5cXG48dGQ+XFxuICAgIDxzZWxlY3QgbmFtZT1cIndvcmxkc1wiIGNsYXNzPVwiZm9ybS1jb250cm9sXCIgZGF0YS1maWVsZD1cIndvcmxkXCI+XFxuXFxuICAgICc7XG4gXy5lYWNoKHdvcmxkcywgZnVuY3Rpb24gKHcpIHsgO1xuX19wICs9ICdcXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCInICtcbigoX190ID0gKCB3ICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiICcgK1xuKChfX3QgPSAoIHcgPT09IHdvcmxkID8gJ3NlbGVjdGVkJyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJz4nICtcbigoX190ID0gKCB3ICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvb3B0aW9uPlxcbiAgICAnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIicgK1xuKChfX3QgPSAoIG5ld1dvcmxkICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiIGNsYXNzPVwibmV3LXdvcmxkLXRleHRcIj48aT4nICtcbigoX190ID0gKCBuZXdXb3JsZCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbicgLSBOZXcgLTwvaT48L29wdGlvbj5cXG4gICAgPC9zZWxlY3Q+XFxuPC90ZD5cXG48dGQ+XFxuICAgIDxzZWxlY3QgbmFtZT1cInJvbGVzXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBkYXRhLWZpZWxkPVwicm9sZVwiPlxcbiAgICAnO1xuIF8uZWFjaChyb2xlcywgZnVuY3Rpb24gKHIpIHsgO1xuX19wICs9ICdcXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCInICtcbigoX190ID0gKCByICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiICcgK1xuKChfX3QgPSAoIHIgPT09IHJvbGUgPyAnc2VsZWN0ZWQnIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPicgK1xuKChfX3QgPSAoIHIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC9vcHRpb24+XFxuICAgICc7XG4gfSk7IDtcbl9fcCArPSAnXFxuXFxuICAgICc7XG4gXy5lYWNoKG9wdGlvbmFsUm9sZXMsIGZ1bmN0aW9uIChyKSB7IDtcbl9fcCArPSAnXFxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiJyArXG4oKF9fdCA9ICggciApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbidcIiAnICtcbigoX190ID0gKCByID09PSByb2xlID8gJ3NlbGVjdGVkJyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJz4nICtcbigoX190ID0gKCByICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJyA8aT4oT3B0aW9uYWwpPC9pPjwvb3B0aW9uPlxcbiAgICAnO1xuIH0pOyA7XG5fX3AgKz0gJ1xcbiAgICA8L3NlbGVjdD5cXG48L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCBsYXN0TmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCB1c2VyTmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCAhd29ybGQgPyAnPGVtIGNsYXNzPVwiZi1pY29uIGYtd2FybmluZ1wiPjwvZW0+JyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkIGNsYXNzPVwiYWN0aW9uc1wiPlxcbiAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi10b29scyBidG4tc2F2ZSBzYXZlXCI+U2F2ZTwvYnV0dG9uPlxcbiAgICA8YnV0dG9uIGNsYXNzPVwiYnRuIGJ0bi10b29scyBidG4tY2FuY2VsIGNhbmNlbFwiPkNhbmNlbDwvYnV0dG9uPlxcbjwvdGQ+JztcblxufVxucmV0dXJuIF9fcFxufTtcbmV4cG9ydHNbXCJ1c2VyLXJvd1wiXSA9IGZ1bmN0aW9uKG9iaikge1xub2JqIHx8IChvYmogPSB7fSk7XG52YXIgX190LCBfX3AgPSAnJywgX19lID0gXy5lc2NhcGU7XG53aXRoIChvYmopIHtcbl9fcCArPSAnPHRkPjxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBjbGFzcz1cInNlbGVjdFwiIGRhdGEtaWQ9XCInICtcbigoX190ID0gKCBpZCkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggIWlzV29ybGRDb21wbGV0ZSA/ICc8ZW0gY2xhc3M9XCJmLWljb24gZi13YXJuaW5nXCI+PC9lbT4nIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggd29ybGQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQ+JyArXG4oKF9fdCA9ICggcm9sZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCBsYXN0TmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCB1c2VyTmFtZSApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCAhd29ybGQgPyAnPGVtIGNsYXNzPVwiZi1pY29uIGYtd2FybmluZ1wiPjwvZW0+JyA6ICcnICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkIGNsYXNzPVwiYWN0aW9uc1wiPjxidXR0b24gY2xhc3M9XCJidG4gZWRpdCBidG4tZWRpdCBidG4tdG9vbHMgYXV0by1oaWRlXCI+RWRpdDwvYnV0dG9uPjwvdGQ+JztcblxufVxucmV0dXJuIF9fcFxufTsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1vZGVsJyk7XG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBkZWZhdWx0czoge1xuICAgICAgICB3b3JsZDogJycsXG4gICAgICAgIHJvbGU6ICcnLFxuICAgICAgICBhY3RpdmU6IHRydWUsXG4gICAgICAgIGlzV29ybGRDb21wbGV0ZTogdHJ1ZSxcbiAgICAgICAgZmlyc3ROYW1lOiAnJyxcbiAgICAgICAgbGFzdE5hbWU6ICcnXG4gICAgfSxcblxuICAgIG1ha2VBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lbWJlckFwaSA9IHNlcnZpY2VMb2NhdG9yLm1lbWJlckFwaSgpO1xuICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgdXNlcklkOiB0aGlzLmdldCgnaWQnKSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IHRoaXMuZ2V0KCdncm91cElkJylcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLmdldCgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gbWVtYmVyQXBpLm1ha2VVc2VyQWN0aXZlKHBhcmFtcylcbiAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBvcmlnaW5hbCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBtYWtlSW5hY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lbWJlckFwaSA9IHNlcnZpY2VMb2NhdG9yLm1lbWJlckFwaSgpO1xuICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgdXNlcklkOiB0aGlzLmdldCgnaWQnKSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IHRoaXMuZ2V0KCdncm91cElkJylcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLmdldCgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuIG1lbWJlckFwaS5tYWtlVXNlckluYWN0aXZlKHBhcmFtcylcbiAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBvcmlnaW5hbCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi91c2VyLW1vZGVsJyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1jb2xsZWN0aW9uJyk7XG52YXIgZW52ID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBtb2RlbDogTW9kZWwsXG5cbiAgICBzb3J0Rm46IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhdyA9IGEuZ2V0KCd3b3JsZCcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBidyA9IGIuZ2V0KCd3b3JsZCcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChhdyAhPT0gYncpIHtcbiAgICAgICAgICAgIHJldHVybiBhdyA8IGJ3ID8gLTEgOiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGIuZ2V0KCd1c2VyTmFtZScpID4gYS5nZXQoJ3VzZXJOYW1lJykgPyAtMSA6IDE7XG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIGVudi5nZXQoKS50b2tlblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWxsVXNlcnNBc3NpZ25lZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbGwoZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXUuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0VW5hc3NpZ25lZFVzZXJzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICByZXR1cm4gIXUuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB9KS5sZW5ndGg7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBncm91cElkID0gZW52LmdldCgpLmdyb3VwSWQ7XG5cbiAgICAgICAgdmFyIGdldEdyb3VwVXNlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbWVtYmVyQXBpID0gc2VydmljZUxvY2F0b3IubWVtYmVyQXBpKCk7XG4gICAgICAgICAgICB2YXIgdXNlckFwaSA9IHNlcnZpY2VMb2NhdG9yLnVzZXJBcGkoKTtcblxuICAgICAgICAgICAgdmFyIGxvYWRHcm91cE1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lbWJlckFwaS5nZXRHcm91cERldGFpbHMoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBsb2FkVXNlcnNJbmZvID0gZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vbkZhY0FuZEFjdGl2ZSA9IGZ1bmN0aW9uICh1KSB7IHJldHVybiB1LmFjdGl2ZSAmJiB1LnJvbGUgIT09ICdmYWNpbGl0YXRvcic7IH07XG4gICAgICAgICAgICAgICAgdmFyIHVzZXJzID0gXy5wbHVjayhfLmZpbHRlcihncm91cC5tZW1iZXJzLCBub25GYWNBbmRBY3RpdmUpLCAndXNlcklkJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJBcGkuZ2V0KHsgaWQ6IHVzZXJzIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGxvYWRHcm91cE1lbWJlcnMoKVxuICAgICAgICAgICAgICAgIC50aGVuKGxvYWRVc2Vyc0luZm8pXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZ2V0R3JvdXBVc2VycygpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcbiAgICAgICAgICAgICAgICB1c2VycyA9IF8ubWFwKHVzZXJzLCBmdW5jdGlvbiAodSkgeyByZXR1cm4gXy5leHRlbmQodSwgeyBncm91cElkOiBncm91cElkIH0pOyB9KTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXQodXNlcnMpO1xuICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKHVzZXJzLCBfdGhpcyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1vZGVsJyk7XG52YXIgX19zdXBlciA9IEJhc2UucHJvdG90eXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG5cbiAgICBkZWZhdWx0czoge1xuICAgICAgICB1c2VyczogbnVsbCxcbiAgICAgICAgbW9kZWw6ICdtb2RlbC5lcW4nXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX19zdXBlci5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgdGhpcy5fZGF0YS51c2VycyA9IHRoaXMuX2RhdGEudXNlcnMgfHwgW107XG5cbiAgICAgICAgdGhpcy5fd29ybGRBcGkgPSBzZXJ2aWNlTG9jYXRvci53b3JsZEFwaSgpO1xuXG4gICAgICAgIHZhciBpZCA9IHRoaXMuZ2V0KCdpZCcpO1xuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmxkQXBpLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkVXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdmFyIHVzZXJzID0gdGhpcy5nZXQoJ3VzZXJzJyk7XG4gICAgICAgIHVzZXJzLnB1c2godXNlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZSgpO1xuICAgIH0sXG5cbiAgICByZW1vdmVVc2VyOiBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB2YXIgaWQgPSB0aGlzLmdldCgnaWQnKTtcbiAgICAgICAgdmFyIGNoZWNrV29ybGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZ2V0KCd1c2VycycpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmxkQXBpLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSkuZGVsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICBfLnJlbW92ZSh0aGlzLmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiB1LmdldCgnaWQnKSA9PT0gdXNlci5nZXQoJ2lkJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl93b3JsZEFwaVxuICAgICAgICAgICAgLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSlcbiAgICAgICAgICAgIC5yZW1vdmVVc2VyKHsgdXNlcklkOiB1c2VyLmdldCgnaWQnKSB9KVxuICAgICAgICAgICAgLnRoZW4oY2hlY2tXb3JsZCk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG1hcFVzZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMuZ2V0KCd1c2VycycpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSB7IHVzZXJJZDogdS5nZXQoJ2lkJykgfTtcbiAgICAgICAgICAgICAgICB2YXIgcm9sZSA9IHUuZ2V0KCdyb2xlJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAocm9sZSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucm9sZSA9IHJvbGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdmFyIGNyZWF0ZVdvcmxkID0gXy5wYXJ0aWFsKHRoaXMuX3dvcmxkQXBpLmNyZWF0ZSwgdGhpcy5waWNrKFsnbW9kZWwnLCAnbmFtZScsICdtaW5Vc2VycyddKSk7XG4gICAgICAgIHZhciBhZGRVc2VycyA9IF8ucGFydGlhbChfdGhpcy5fd29ybGRBcGkuYWRkVXNlcnMsIG1hcFVzZXJzKCksIHsgZmlsdGVyOiBfdGhpcy5nZXQoJ2lkJykgfSk7XG4gICAgICAgIHZhciBzYXZlZFVzZXJzID0gdGhpcy5nZXQoJ3VzZXJzJyk7XG4gICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcbiAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gY3JlYXRlIHRoZSB3b3JsZCBpbiB0aGUgQVBJIGFuZCB0aGVuIGFkZCB0aGUgdXNlcnNcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVXb3JsZCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNldCh3b3JsZCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl93b3JsZEFwaS51cGRhdGVDb25maWcoeyBmaWx0ZXI6IHdvcmxkLmlkIH0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oYWRkVXNlcnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHVzZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbmNlIHdlIHJlLXNldCB0aGUgd29ybGQsIHJlLXNldCB0aGUgdXNlcnNcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2V0KCd1c2VycycsIHNhdmVkVXNlcnMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhlIHdvcmxkIGlzIGFscmVhZHkgY3JlYXRlZCBqdXN0IGFkZCB0aGUgdXNlcnNcbiAgICAgICAgICAgIHJldHVybiBhZGRVc2VycygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGlzTmV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5nZXQoJ2xhc3RNb2RpZmllZCcpO1xuICAgIH1cblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL3dvcmxkLW1vZGVsJyk7XG52YXIgVXNlck1vZGVsID0gcmVxdWlyZSgnLi91c2VyLW1vZGVsJyk7XG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xuXG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1jb2xsZWN0aW9uJyk7XG52YXIgX19zdXBlciA9IEJhc2UucHJvdG90eXBlO1xuXG52YXIgZG9uZUZuID0gZnVuY3Rpb24gKGR0ZCwgYWZ0ZXIpIHtcbiAgICByZXR1cm4gXy5hZnRlcihhZnRlciwgZHRkLnJlc29sdmUpO1xufTtcblxudmFyIHdvcmxkQXBpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG4gICAgbW9kZWw6IE1vZGVsLFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBfX3N1cGVyLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgd29ybGRBcGkgPSBzZXJ2aWNlTG9jYXRvci53b3JsZEFwaSgpO1xuICAgIH0sXG5cbiAgICBhdXRvQXNzaWduQWxsOiBmdW5jdGlvbiAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gd29ybGRBcGkuYXV0b0Fzc2lnbihvcHRpb25zKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQodGhpcy5wYXJzZSh3b3JsZHMpKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIGdldEluY29tcGxldGVXb3JsZHNDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5maWx0ZXIoZnVuY3Rpb24gKHcpIHtcbiAgICAgICAgICAgIHJldHVybiAhdy5nZXQoJ2NvbXBsZXRlJyk7XG4gICAgICAgIH0pLmxlbmd0aDtcbiAgICB9LFxuXG4gICAgdXBkYXRlVXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdmFyIHdvcmxkTmFtZSA9IHVzZXIuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgcHJldldvcmxkID0gdGhpcy5nZXRXb3JsZEJ5VXNlcih1c2VyKTtcbiAgICAgICAgdmFyIGN1cldvcmxkID0gdGhpcy5nZXRPckNyZWF0ZVdvcmxkKHdvcmxkTmFtZSk7XG4gICAgICAgIHZhciBkb25lID0gZG9uZUZuKGR0ZCwgMSk7XG5cbiAgICAgICAgLy8gY2hlY2sgaWYgdGhlcmUncyBhbnl0aGluZyB0byBkb1xuICAgICAgICBpZiAoIXByZXZXb3JsZCAmJiAhY3VyV29ybGQpIHtcbiAgICAgICAgICAgIHJldHVybiBkdGQucmVzb2x2ZSgpLnByb21pc2UoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChwcmV2V29ybGQpIHtcbiAgICAgICAgICAgIHByZXZXb3JsZC5yZW1vdmVVc2VyKHVzZXIpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoY3VyV29ybGQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBjdXJXb3JsZC5hZGRVc2VyKHVzZXIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihkb25lKTtcbiAgICAgICAgfSBlbHNlIGlmIChjdXJXb3JsZCkge1xuICAgICAgICAgICAgY3VyV29ybGQuYWRkVXNlcih1c2VyKVxuICAgICAgICAgICAgICAgIC50aGVuKGRvbmUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGR0ZC5wcm9taXNlKCk7XG4gICAgfSxcblxuICAgIGdldE9yQ3JlYXRlV29ybGQ6IGZ1bmN0aW9uICh3b3JsZE5hbWUpIHtcbiAgICAgICAgaWYgKCF3b3JsZE5hbWUpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB3b3JsZCA9IHRoaXMuZ2V0V29yZEJ5TmFtZSh3b3JsZE5hbWUpO1xuXG4gICAgICAgIGlmICghd29ybGQpIHtcbiAgICAgICAgICAgIHdvcmxkID0gdGhpcy5jcmVhdGUoeyBuYW1lOiB3b3JsZE5hbWUgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gd29ybGQ7XG4gICAgfSxcblxuICAgIGdldFdvcmRCeU5hbWU6IGZ1bmN0aW9uICh3b3JsZE5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgIHJldHVybiB3b3JsZC5nZXQoJ25hbWUnKSA9PT0gd29ybGROYW1lO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0V29ybGRCeVVzZXI6IGZ1bmN0aW9uICh1c2VyKSB7XG4gICAgICAgIGlmICghdXNlci5nZXQpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignZ2V0V29ybGRCeVVzZXIgZXhwZWN0ZXMgYSBtb2RlbCAoJyArIHVzZXIgKyAnKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGlkID0gdXNlci5nZXQoJ2lkJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmdldFdvcmxkQnlVc2VySWQoaWQpO1xuICAgIH0sXG5cbiAgICBnZXRXb3JsZEJ5VXNlcklkOiBmdW5jdGlvbiAodXNlcklkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbmQoZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICByZXR1cm4gXy5maW5kKHdvcmxkLmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdS5nZXQoJ2lkJykgPT09IHVzZXJJZDtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0V29ybGROYW1lczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5wbHVjaygnbmFtZScpO1xuICAgIH0sXG5cbiAgICBnZXROZXh0V29ybGROYW1lOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYWQgPSBmdW5jdGlvbiAobnVtLCBwbGFjZXMpIHtcbiAgICAgICAgICAgIHZhciB6ZXJvcyA9ICcwMDAwMDAwMDAwMDAwMDAwMDAnO1xuICAgICAgICAgICAgdmFyIGRpZ2l0cyA9IG51bS50b1N0cmluZygpLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBuZWVkZWQgPSBwbGFjZXMgLSBkaWdpdHM7XG4gICAgICAgICAgICByZXR1cm4gemVyb3Muc3Vic3RyKDAsIG5lZWRlZCkgKyBudW07XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIHdvcmxkcyA9IHRoaXMuZ2V0V29ybGROYW1lcygpO1xuXG4gICAgICAgIGlmICghd29ybGRzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuICdXb3JsZDAwMSc7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvcGVyTmFtZXMgPSBfLmZpbHRlcih3b3JsZHMsIGZ1bmN0aW9uICh3KSB7IHJldHVybiAvV29ybGRcXGRcXGRcXGQvLnRlc3Qodyk7IH0pLnNvcnQoKTtcbiAgICAgICAgdmFyIGxhc3RXb3JsZCA9IHByb3Blck5hbWVzW3Byb3Blck5hbWVzLmxlbmd0aCAtIDFdO1xuICAgICAgICB2YXIgbnVtV29ybGQgPSArbGFzdFdvcmxkLm1hdGNoKC9Xb3JsZChcXGRcXGRcXGQpLylbMV07XG4gICAgICAgIHJldHVybiAnV29ybGQnICsgcGFkKG51bVdvcmxkICsgMSwgMyk7XG4gICAgfSxcblxuICAgIHNldFVzZXJzQ29sbGVjdGlvbjogZnVuY3Rpb24gKHVzZXJzQ29sbGVjdGlvbikge1xuICAgICAgICB0aGlzLnVzZXJzQ29sbGVjdGlvbiA9IHVzZXJzQ29sbGVjdGlvbjtcbiAgICB9LFxuXG4gICAgam9pblVzZXJzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1c2Vyc0hhc2ggPSB7fTtcbiAgICAgICAgdmFyIHVzZXJzQ29sbGVjdGlvbiA9IHRoaXMudXNlcnNDb2xsZWN0aW9uO1xuICAgICAgICB1c2Vyc0NvbGxlY3Rpb24uZWFjaChmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgdS5zZXQoeyBpc1dvcmxkQ29tcGxldGU6IHRydWUgfSk7XG4gICAgICAgICAgICByZXR1cm4gKHVzZXJzSGFzaFt1LmdldCgnaWQnKV0gPSB1KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uICh3LCBpKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IHcuZ2V0KCduYW1lJyk7XG4gICAgICAgICAgICB2YXIgaXNDb21wbGV0ZSA9IHcuZ2V0KCdjb21wbGV0ZScpO1xuICAgICAgICAgICAgdy5zZXQoeyBpbmRleDogaSwgbmFtZTogbmFtZSB8fCAoaSArIDEpICsgJycgfSk7XG4gICAgICAgICAgICBfLmVhY2gody5nZXQoJ3VzZXJzJyksIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgaWYgKHVzZXJzSGFzaFt1LmdldCgndXNlcklkJyldKSB7XG4gICAgICAgICAgICAgICAgICAgIHVzZXJzSGFzaFt1LmdldCgndXNlcklkJyldLnNldCh7IHdvcmxkOiBuYW1lLCByb2xlOiB1LmdldCgncm9sZScpLCBpc1dvcmxkQ29tcGxldGU6IGlzQ29tcGxldGUgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHVzZXJzQ29sbGVjdGlvbi5zb3J0KCk7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB3b3JsZEFwaS5saXN0KClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICh3b3JsZHMpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlc2V0KHRoaXMucGFyc2Uod29ybGRzKSk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBwYXJzZTogZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICBpZiAod29ybGRzLmxlbmd0aCkge1xuICAgICAgICAgICAgd29ybGRzID0gXy5tYXAod29ybGRzLCBmdW5jdGlvbiAodykge1xuICAgICAgICAgICAgICAgIHZhciB1c2VycyA9IF8ubWFwKHcudXNlcnMsIGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGluIHRoZSB3b3JsZCBhcGkgdXNlcnMgSWRzIGNvbWVzIGFzIHVzZXJJZFxuICAgICAgICAgICAgICAgICAgICAvLyBtYWtlIHN1cmUgd2UgYWRkIGl0IGFzIGlkIHNvIHdlIGNhbiB1c2UgdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIHNhbWUgY29kZSB0byBhY2Nlc3MgbW9kZWxzIHRoYXQgY29tZSBmcm9tIHRoZVxuICAgICAgICAgICAgICAgICAgICAvLyBtZW1iZXIvbG9jYWwgYXBpIGFzIHdpdGggdGhlIHdvcmxkIGFwaVxuICAgICAgICAgICAgICAgICAgICB1LmlkID0gdS51c2VySWQ7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgVXNlck1vZGVsKHUpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgdy51c2VycyA9IHVzZXJzO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHc7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3b3JsZHM7XG4gICAgfVxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBVdGlsaXR5IGNsYXNzIHRvIG1ha2UgYWpheCBjYWxscyBzZXF1ZW5jaWFsXG4qL1xuZnVuY3Rpb24gQWpheFF1ZXVlICgpIHtcbiAgICB0aGlzLnF1ZXVlID0gW107XG59XG5cbiQuZXh0ZW5kKEFqYXhRdWV1ZS5wcm90b3R5cGUsIHtcbiAgICBhZGQ6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5wdXNoKGZuKTtcbiAgICB9LFxuXG4gICAgZXhlY3V0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcblxuICAgICAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLnF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBmbiA9IF90aGlzLnF1ZXVlLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbnRleHQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKG5leHQpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbmV4dCgpO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQWpheFF1ZXVlOyIsIi8qKlxuLyogSW5oZXJpdCBmcm9tIGEgY2xhc3MgKHVzaW5nIHByb3RvdHlwZSBib3Jyb3dpbmcpXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpbmhlcml0KEMsIFApIHtcbiAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIEYucHJvdG90eXBlID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUgPSBuZXcgRigpO1xuICAgIEMuX19zdXBlciA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQztcbn1cblxuLyoqXG4qIFNoYWxsb3cgY29weSBvZiBhbiBvYmplY3RcbiovXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3QgLyosIHZhcl9hcmdzKi8pIHtcbiAgICB2YXIgb2JqID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgY3VycmVudDtcbiAgICBmb3IgKHZhciBqID0gMDsgajxvYmoubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCEoY3VycmVudCA9IG9ialtqXSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90IHdyYXAgaW5uZXIgaW4gZGVzdC5oYXNPd25Qcm9wZXJ0eSBvciBiYWQgdGhpbmdzIHdpbGwgaGFwcGVuXG4gICAgICAgIC8qanNoaW50IC1XMDg5ICovXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjdXJyZW50KSB7XG4gICAgICAgICAgICBkZXN0W2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhc2UsIHByb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSBiYXNlO1xuICAgIHZhciBjaGlsZDtcblxuICAgIGNoaWxkID0gcHJvcHMgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgPyBwcm9wcy5jb25zdHJ1Y3RvciA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuXG4gICAgLy8gYWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjaGlsZCBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgIGV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBhc3NvY2lhdGUgcHJvdG90eXBlIGNoYWluXG4gICAgaW5oZXJpdChjaGlsZCwgcGFyZW50KTtcblxuICAgIC8vIGFkZCBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgaWYgKHByb3BzKSB7XG4gICAgICAgIGV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBkb25lXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcbiJdfQ==
