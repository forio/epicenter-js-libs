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
        isWorldComplete: true
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9ncnVudC1icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Fzc2lnbm1lbnQtcm93LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9hc3NpZ25tZW50LmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9iYXNlLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2Jhc2UtbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL2RlZmF1bHRzLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy9pbmRleC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvcHJvamVjdC1tb2RlbC5qcyIsInNyYy9jb21wb25lbnRzL2Fzc2lnbm1lbnQvanMvc2VydmljZS1sb2NhdG9yLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy90ZW1wbGF0ZXMuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXItbW9kZWwuanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3VzZXJzLWNvbGxlY3Rpb24uanMiLCJzcmMvY29tcG9uZW50cy9hc3NpZ25tZW50L2pzL3dvcmxkLW1vZGVsLmpzIiwic3JjL2NvbXBvbmVudHMvYXNzaWdubWVudC9qcy93b3JsZHMtY29sbGVjdGlvbi5qcyIsInNyYy91dGlsL2FqYXgtcXVldWUuanMiLCJzcmMvdXRpbC9pbmhlcml0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hSQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9FQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0JztcblxudmFyIHRlbXBsYXRlcyA9IHJlcXVpcmUoJy4vdGVtcGxhdGVzJyk7XG5cbnZhciBBc3NpZ25tZW50Um93ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICB0aGlzLiRlbCA9ICQoJzx0cj4nKTtcbiAgICB0aGlzLmVsID0gdGhpcy4kZWxbMF07XG4gICAgdGhpcy4kID0gXy5wYXJ0aWFsUmlnaHQoJCwgdGhpcy4kZWwpO1xuXG4gICAgdGhpcy5tb2RlbCA9IG9wdGlvbnMubW9kZWw7XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLndvcmxkcyA9IG9wdGlvbnMud29ybGRzO1xuICAgIHRoaXMucHJvamVjdCA9IG9wdGlvbnMucHJvamVjdDtcblxuICAgIF8uYmluZEFsbCh0aGlzLCBbJ3NldEVkaXRNb2RlJywgJ3JlbW92ZUVkaXRNb2RlJywgJ3NhdmVFZGl0JywgJ2NhbmNlbEVkaXQnLCAndXBkYXRlRGF0YSddKTtcblxuICAgIHRoaXMuYmluZEV2ZW50cygpO1xuXG59O1xuXG5fLmV4dGVuZChBc3NpZ25tZW50Um93LnByb3RvdHlwZSwge1xuXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlc1sndXNlci1yb3cnXSxcblxuICAgIGVkaXRUZW1wbGF0ZTogdGVtcGxhdGVzWydlZGl0LXVzZXItcm93J10sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICdidXR0b24uZWRpdCcsIHRoaXMuc2V0RWRpdE1vZGUpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnYnV0dG9uLnNhdmUnLCB0aGlzLnNhdmVFZGl0KTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJ2J1dHRvbi5jYW5jZWwnLCB0aGlzLmNhbmNlbEVkaXQpO1xuICAgIH0sXG5cbiAgICByZW1vdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwub2ZmKCdjbGljaycsIG51bGwsIG51bGwpO1xuICAgICAgICAvLyB0aGlzIG9ubHkgZ2l2ZXMgYSBkZWxheSB0byByZW1vdmUgdGhlIHRyXG4gICAgICAgIC8vIGFuaW1hdGlvbiBvZiBoZWlnaHQgb2YgdGhlIHRyIGRvZXMgbm90IHdvcmtcbiAgICAgICAgdGhpcy4kKCc6Y2hlY2tib3gnKS5hdHRyKCdjaGVja2VkJywgZmFsc2UpO1xuICAgICAgICB0aGlzLiRlbFxuICAgICAgICAgICAgLmNzcyh7IG9wYWNpdHk6IDAuMyB9KVxuICAgICAgICAgICAgLmFuaW1hdGUoeyBoZWlnaHQ6IDAgfSwge1xuICAgICAgICAgICAgICAgIGR1cmF0aW9uOiAzMDAsXG4gICAgICAgICAgICAgICAgY29tcGxldGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgbWFrZUluYWN0aXZlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1vZGVsLm1ha2VJbmFjdGl2ZSgpO1xuICAgIH0sXG5cbiAgICBzZXRFZGl0TW9kZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm1vZGVsLnNldCgnZWRpdC1tb2RlJywgdHJ1ZSk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHJlbW92ZUVkaXRNb2RlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubW9kZWwuc2V0KCdlZGl0LW1vZGUnLCBmYWxzZSk7XG4gICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgfSxcblxuICAgIHNhdmVFZGl0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHRoaXMudXBkYXRlRGF0YSgpO1xuICAgICAgICB0aGlzLndvcmxkc1xuICAgICAgICAgICAgLnVwZGF0ZVVzZXIodGhpcy5tb2RlbClcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBfdGhpcy5yZW1vdmVFZGl0TW9kZSgpO1xuICAgICAgICAgICAgICAgIF90aGlzLiRlbC50cmlnZ2VyKCd1cGRhdGUnLCBfdGhpcyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2FuY2VsRWRpdDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnJlbW92ZUVkaXRNb2RlKCk7XG4gICAgfSxcblxuICAgIHJlbmRlcjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdGVtcGwgPSB0aGlzLm1vZGVsLmdldCgnZWRpdC1tb2RlJykgPyB0aGlzLmVkaXRUZW1wbGF0ZSA6IHRoaXMudGVtcGxhdGU7XG4gICAgICAgIHZhciB2bSA9IF8uZXh0ZW5kKHtcbiAgICAgICAgICAgIHJvbGVzOiB0aGlzLnByb2plY3QuZ2V0KCdyb2xlcycpLFxuICAgICAgICAgICAgb3B0aW9uYWxSb2xlczogdGhpcy5wcm9qZWN0LmdldCgnb3B0aW9uYWxSb2xlcycpLFxuICAgICAgICAgICAgd29ybGRzOiB0aGlzLndvcmxkcy5nZXRXb3JsZE5hbWVzKCksXG4gICAgICAgICAgICBuZXdXb3JsZDogdGhpcy53b3JsZHMuZ2V0TmV4dFdvcmxkTmFtZSgpXG4gICAgICAgIH0sIHRoaXMubW9kZWwudG9KU09OKCkpO1xuXG4gICAgICAgIHRoaXMuJGVsLmh0bWwodGVtcGwodm0pKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgdXBkYXRlRGF0YTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICB0aGlzLiQoJ1tkYXRhLWZpZWxkXScpLmVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGVsID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBmaWVsZCA9IGVsLmRhdGEoJ2ZpZWxkJyk7XG4gICAgICAgICAgICB2YXIgdmFsID0gZWwudmFsKCk7XG5cbiAgICAgICAgICAgIF90aGlzLm1vZGVsLnNldChmaWVsZCwgdmFsKTtcbiAgICAgICAgfSk7XG4gICAgfVxufSk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBBc3NpZ25tZW50Um93OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIFVzZXJzQ29sbGVjdGlvbiA9IHJlcXVpcmUoJy4vdXNlcnMtY29sbGVjdGlvbicpO1xudmFyIFdvcmxkc0NvbGxlY3Rpb24gPSByZXF1aXJlKCcuL3dvcmxkcy1jb2xsZWN0aW9uJyk7XG52YXIgUHJvamVjdE1vZGVsID0gcmVxdWlyZSgnLi9wcm9qZWN0LW1vZGVsJyk7XG52YXIgQXNzaWduZW1udFJvdyA9IHJlcXVpcmUoJy4vYXNzaWdubWVudC1yb3cnKTtcbnZhciBlbnYgPSByZXF1aXJlKCcuL2RlZmF1bHRzJyk7XG52YXIgQWpheFF1ZXVlID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9hamF4LXF1ZXVlJyk7XG5cbmZ1bmN0aW9uIHNldEVudmlyb25tZW50KG9wdGlvbnMpIHtcbiAgICBlbnYuc2V0KF8ub21pdChvcHRpb25zLCAnZWwnKSk7XG59XG5cbnZhciBBc3NpZ25tZW50ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICBzZXRFbnZpcm9ubWVudChvcHRpb25zKTtcbiAgICB0aGlzLmluaXRpYWxpemUob3B0aW9ucyk7XG59O1xuXG5Bc3NpZ25tZW50LnByb3RvdHlwZSA9IHtcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuZWwgPSB0eXBlb2Ygb3B0aW9ucy5lbCA9PT0gJ3N0cmluZycgPyAkKG9wdGlvbnMuZWwpWzBdIDogb3B0aW9ucy5lbDtcbiAgICAgICAgdGhpcy4kZWwgPSAkKHRoaXMuZWwpO1xuICAgICAgICB0aGlzLiQgPSBfLnBhcnRpYWxSaWdodCgkLCB0aGlzLmVsKTtcblxuICAgICAgICB0aGlzLnVzZXJzID0gbmV3IFVzZXJzQ29sbGVjdGlvbigpO1xuICAgICAgICB0aGlzLndvcmxkcyA9IG5ldyBXb3JsZHNDb2xsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMucHJvamVjdCA9IG5ldyBQcm9qZWN0TW9kZWwoKTtcblxuICAgICAgICBfLmJpbmRBbGwodGhpcywgWydyZW5kZXInLCAncmVuZGVyVGFibGUnLCAndG9nZ2xlQ29udHJvbGxzJywgJ3NhdmVFZGl0JywgJ3NlbGVjdEFsbCcsICd1c2Fzc2lnblNlbGVjdGVkJywgJ19zaG93VXBkYXRpbmcnLCAnX2hpZGVVcGRhdGluZycsICdhdXRvQXNzaWduQWxsJywgJ21ha2VVc2VySW5hY3RpdmUnXSk7XG5cbiAgICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwub24oJ3VwZGF0ZScsICd0cicsIHRoaXMuc2F2ZUVkaXQpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnaW5wdXQ6Y2hlY2tib3g6bm90KCNzZWxlY3QtYWxsKScsIHRoaXMudG9nZ2xlQ29udHJvbGxzKTtcbiAgICAgICAgdGhpcy4kZWwub24oJ2NsaWNrJywgJyNzZWxlY3QtYWxsJywgdGhpcy5zZWxlY3RBbGwpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLnVuYXNzaWduLXVzZXInLCB0aGlzLnVzYXNzaWduU2VsZWN0ZWQpO1xuICAgICAgICB0aGlzLiRlbC5vbignY2xpY2snLCAnLmF1dG8tYXNzaWduLWFsbCcsIHRoaXMuYXV0b0Fzc2lnbkFsbCk7XG4gICAgICAgIHRoaXMuJGVsLm9uKCdjbGljaycsICcubWFrZS11c2VyLWluYWN0aXZlJywgdGhpcy5tYWtlVXNlckluYWN0aXZlKTtcbiAgICB9LFxuXG4gICAgbG9hZDogZnVuY3Rpb24gKCkge1xuXG4gICAgICAgIHZhciBqb2luID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdGhpcy53b3JsZHMuc2V0VXNlcnNDb2xsZWN0aW9uKHRoaXMudXNlcnMpO1xuICAgICAgICAgICAgdGhpcy53b3JsZHMuam9pblVzZXJzKCk7XG4gICAgICAgICAgICB0aGlzLnJlbmRlcigpO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgcmV0dXJuICQud2hlbihcbiAgICAgICAgICAgIHRoaXMud29ybGRzLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnVzZXJzLmZldGNoKCksXG4gICAgICAgICAgICB0aGlzLnByb2plY3QuZmV0Y2goKVxuICAgICAgICApLnRoZW4oam9pbik7XG5cbiAgICB9LFxuXG4gICAgc2F2ZUVkaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy53b3JsZHMuZmV0Y2goKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICAgICAgdGhpcy51cGRhdGVDb250cm9scygpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgYXV0b0Fzc2lnbkFsbDogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLl9zaG93VXBkYXRpbmcoKTtcbiAgICAgICAgdmFyIG1heFVzZXJzID0gK3RoaXMuJCgnI21heC11c2VycycpLnZhbCgpO1xuICAgICAgICByZXR1cm4gdGhpcy53b3JsZHMuYXV0b0Fzc2lnbkFsbCh7IG1heFVzZXJzOiBtYXhVc2VycyB9KVxuICAgICAgICAgICAgLmRvbmUodGhpcy5faGlkZVVwZGF0aW5nKVxuICAgICAgICAgICAgLmZhaWwodGhpcy5faGlkZVVwZGF0aW5nKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBnZXRTZWxlY3RlZElkczogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3g6Y2hlY2tlZCcpLm1hcChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJCh0aGlzKS5kYXRhKCdpZCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZmluZFJvd1ZpZXdzOiBmdW5jdGlvbiAoaWRzKSB7XG4gICAgICAgIHJldHVybiBfLm1hcChpZHMsIGZ1bmN0aW9uIChpZCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMucm93Vmlld3NbaWRdO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICB9LFxuXG4gICAgdW5hc3NpZ25Vc2VyczogZnVuY3Rpb24gKGlkcykge1xuICAgICAgICB2YXIgZHRkID0gJC5EZWZlcnJlZCgpO1xuICAgICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGR0ZC5yZXNvbHZlKCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gZm9yIG5vdyB3ZSBuZWVkIHRvIHNlcXVlbmNlIHRoZSBjYWxscyB0byB1bmFzc2lnbiB1c2VycyBmcm9tIHdvcmxkc1xuICAgICAgICB2YXIgcXVldWUgPSBuZXcgQWpheFF1ZXVlKCk7XG5cbiAgICAgICAgXy5lYWNoKGlkcywgZnVuY3Rpb24gKHVzZXJJZCkge1xuICAgICAgICAgICAgdmFyIHVzZXIgPSB0aGlzLnVzZXJzLmdldEJ5SWQodXNlcklkKTtcbiAgICAgICAgICAgIHVzZXIuc2V0KCd3b3JsZCcsICcnKTtcbiAgICAgICAgICAgIHVzZXIuc2V0KCdyb2xlJywgJycpO1xuICAgICAgICAgICAgcXVldWUuYWRkKF8ucGFydGlhbChfLmJpbmQodGhpcy53b3JsZHMudXBkYXRlVXNlciwgdGhpcy53b3JsZHMpLCB1c2VyKSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHF1ZXVlLmV4ZWN1dGUodGhpcykudGhlbihkb25lKTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgdXNhc3NpZ25TZWxlY3RlZDogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBpZHMgPSB0aGlzLmdldFNlbGVjdGVkSWRzKCk7XG5cbiAgICAgICAgdmFyIGRvbmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aGlzLndvcmxkcy5mZXRjaCgpLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHRoaXMud29ybGRzLmpvaW5Vc2VycygpO1xuICAgICAgICAgICAgICAgIHRoaXMuX2hpZGVVcGRhdGluZygpO1xuICAgICAgICAgICAgICAgIHRoaXMucmVuZGVyKCk7XG5cbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB0aGlzLl9zaG93VXBkYXRpbmcoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy51bmFzc2lnblVzZXJzKGlkcykudGhlbihkb25lKTtcbiAgICB9LFxuXG4gICAgbWFrZVVzZXJJbmFjdGl2ZTogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgaWRzID0gdGhpcy5nZXRTZWxlY3RlZElkcygpO1xuICAgICAgICB2YXIgZG9uZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHRoaXMudG9nZ2xlQ29udHJvbGxzKCk7XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICB2YXIgbWFrZVVzZXJzSW5hY3RpdmUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgcm93cyA9IHRoaXMuZmluZFJvd1ZpZXdzKGlkcyk7XG4gICAgICAgICAgICAvLyBmb3Igbm93IHdlIG5lZWQgdG8gc2VxdWVuY2UgdGhlIGNhbGxzIHRvIHBhdGNoIHRoZSB1c2Vyc1xuICAgICAgICAgICAgLy8gc2luY2UgdGhlIEFQSSBjYW4gb25seSBvcGVyYXRlIG9uIG9uZSBjYWxsIHBlciBncm91cCBhdCBhIHRpbWVcbiAgICAgICAgICAgIHZhciBxdWV1ZSA9IG5ldyBBamF4UXVldWUoKTtcbiAgICAgICAgICAgIF8uZWFjaChyb3dzLCBmdW5jdGlvbiAodmlldykge1xuICAgICAgICAgICAgICAgIHZhciB1c2VyID0gdmlldy5tb2RlbDtcbiAgICAgICAgICAgICAgICBxdWV1ZS5hZGQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdmlldy5tYWtlSW5hY3RpdmUoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXIucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmlldy5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgICAgIHF1ZXVlLmV4ZWN1dGUodGhpcykudGhlbihkb25lKTtcbiAgICAgICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLnVuYXNzaWduVXNlcnMoaWRzKVxuICAgICAgICAgICAgLnRoZW4obWFrZVVzZXJzSW5hY3RpdmUpO1xuXG5cbiAgICB9LFxuXG4gICAgcmVuZGVyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJCgndGFibGUgdGJvZHknKS5lbXB0eSgpO1xuICAgICAgICB0aGlzLnJlbmRlclRhYmxlKCk7XG4gICAgICAgIHRoaXMudG9nZ2xlQ29udHJvbGxzKCk7XG4gICAgfSxcblxuICAgIHJlbmRlclRhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMucm93Vmlld3MgPSB7fTtcbiAgICAgICAgdmFyIHJvd3MgPSBbXTtcbiAgICAgICAgdGhpcy51c2Vycy5lYWNoKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICB2YXIgdmlldyA9IG5ldyBBc3NpZ25lbW50Um93KHsgbW9kZWw6IHUsIHdvcmxkczogdGhpcy53b3JsZHMsIHByb2plY3Q6IHRoaXMucHJvamVjdCB9KTtcbiAgICAgICAgICAgIHRoaXMucm93Vmlld3NbdS5nZXQoJ2lkJyldID0gdmlldztcbiAgICAgICAgICAgIHJvd3MucHVzaCh2aWV3LnJlbmRlcigpLmVsKTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdGhpcy4kKCd0YWJsZSB0Ym9keScpLmFwcGVuZChyb3dzKTtcbiAgICB9LFxuXG5cbiAgICB1cGRhdGVDb250cm9sczogZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xzRm9yU2VsZWN0aW9uKCk7XG4gICAgICAgIHRoaXMudXBkYXRlQXV0b0Fzc2lnbkJ1dHRvbigpO1xuICAgICAgICB0aGlzLnVwZGF0ZVN0YXR1cygpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0dXM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGluY29scGxldGVXb3JsZHMgPSB0aGlzLndvcmxkcy5nZXRJbmNvbXBsZXRlV29ybGRzQ291bnQoKTtcbiAgICAgICAgdmFyIHVuYXNzaWduZWRVc2VycyA9IHRoaXMudXNlcnMuZ2V0VW5hc3NpZ25lZFVzZXJzQ291bnQoKTtcbiAgICAgICAgdmFyIHRvdGFsV29ybGRzID0gdGhpcy53b3JsZHMuc2l6ZSgpO1xuXG4gICAgICAgIHZhciB1c2Vyc1RleHQgPSB1bmFzc2lnbmVkVXNlcnMgPyB1bmFzc2lnbmVkVXNlcnMgPT09IDEgPyAnMSB1c2VyIG5lZWRzIGFzc2lnbm1lbnQuJyA6IHVuYXNzaWduZWRVc2VycyArICcgdXNlcnMgbmVlZCBhc3NpZ25tZW50LicgOiAnQWxsIHVzZXJzIGhhdmUgYmVlbiBhc3NpZ25lZC4nO1xuICAgICAgICB2YXIgd29ybGRzVGV4dCA9ICF0b3RhbFdvcmxkcyA/ICdObyB3b3JsZHMgaGF2ZSBiZWVuIGNyZWF0ZWQuJyA6ICFpbmNvbHBsZXRlV29ybGRzID8gJ0FsbCB3b3JsZHMgYXJlIGNvbXBsZXRlLicgOiBpbmNvbHBsZXRlV29ybGRzID09PSAxID8gJzEgaW5jb21wbGV0ZSB3b3JsZCBuZWVkcyBhdHRlbnRpb24uJyA6IGluY29scGxldGVXb3JsZHMgKyAnIGluY29tcGxldGUgd29ybGRzIG5lZWQgYXR0ZW50aW9uLic7XG5cbiAgICAgICAgdGhpcy4kKCcjdXNlcnMtc3RhdHVzIC50ZXh0JykudGV4dCh1c2Vyc1RleHQpO1xuICAgICAgICB0aGlzLiQoJyN3b3JsZHMtc3RhdHVzIC50ZXh0JykudGV4dCh3b3JsZHNUZXh0KTtcblxuICAgICAgICBpZiAodW5hc3NpZ25lZFVzZXJzKSB7XG4gICAgICAgICAgICB0aGlzLiQoJyN1c2Vycy1zdGF0dXMnKS5hZGRDbGFzcygnaW5jb21wbGV0ZScpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy4kKCcjdXNlcnMtc3RhdHVzJykucmVtb3ZlQ2xhc3MoJ2luY29tcGxldGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmNvbHBsZXRlV29ybGRzIHx8ICF0b3RhbFdvcmxkcykge1xuICAgICAgICAgICAgdGhpcy4kKCcjd29ybGRzLXN0YXR1cycpLmFkZENsYXNzKCdpbmNvbXBsZXRlJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJyN3b3JsZHMtc3RhdHVzJykucmVtb3ZlQ2xhc3MoJ2luY29tcGxldGUnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuJCgnLnN0YXR1cy13aWRnZXQnKS5hZGRDbGFzcygndmlzaWJsZScpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVDb250cm9sc0ZvclNlbGVjdGlvbjogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgbnVtU2VsZWN0ZWQgPSB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveDpjaGVja2VkJykubGVuZ3RoO1xuICAgICAgICB0aGlzLiQoJy5jb21wb25lbnQuY29udHJvbHMnKVtudW1TZWxlY3RlZCA/ICdhZGRDbGFzcycgOiAncmVtb3ZlQ2xhc3MnXSgndmlzaWJsZScpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVBdXRvQXNzaWduQnV0dG9uOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgaWYgKHRoaXMucHJvamVjdC5pc0R5bmFtaWNBc3NpZ25tZW50KCkpIHtcbiAgICAgICAgICAgIHZhciBoYXNSb2xlcyA9IHRoaXMucHJvamVjdC5oYXNSb2xlcygpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLnNpbmdsZScpLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5keW5hbWljJykuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLmR5bmFtaWMtbm8tcm9sZXMtdGV4dCcpW2hhc1JvbGVzID8gJ2hpZGUnIDogJ3Nob3cnXSgpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLm5vLXJvbGVzJylbaGFzUm9sZXMgPyAnaGlkZScgOiAnc2hvdyddKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuZHluYW1pYycpLmhpZGUoKTtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzIC5keW5hbWljLW5vLXJvbGVzLXRleHQnKS5oaWRlKCk7XG4gICAgICAgICAgICB0aGlzLiQoJy50YWJsZS1jb250cm9scyAuc2luZ2xlJykuc2hvdygpO1xuICAgICAgICAgICAgdGhpcy4kKCcudGFibGUtY29udHJvbHMgLm5vLXJvbGVzJykuc2hvdygpO1xuXG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy51c2Vycy5hbGxVc2Vyc0Fzc2lnbmVkKCkpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzJykucmVtb3ZlQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnLnRhYmxlLWNvbnRyb2xzJykuYWRkQ2xhc3MoJ3Zpc2libGUnKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBzZWxlY3RBbGw6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgIHRoaXMuJCgndGJvZHkgOmNoZWNrYm94JykucHJvcCgnY2hlY2tlZCcsIGUudGFyZ2V0LmNoZWNrZWQpO1xuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xzKCk7XG4gICAgfSxcblxuICAgIHRvZ2dsZUNvbnRyb2xsczogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgdmFyIHRvdGFsID0gdGhpcy4kKCd0Ym9keSA6Y2hlY2tib3gnKTtcbiAgICAgICAgdmFyIGNoZWNrZWQgPSB0aGlzLiQoJ3Rib2R5IDpjaGVja2JveDpjaGVja2VkJyk7XG5cbiAgICAgICAgaWYgKHRvdGFsLmxlbmd0aCA9PT0gY2hlY2tlZC5sZW5ndGgpIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3NlbGVjdC1hbGwnKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuJCgnI3NlbGVjdC1hbGwnKS5yZW1vdmVBdHRyKCdjaGVja2VkJyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnVwZGF0ZUNvbnRyb2xzKCk7XG4gICAgfSxcblxuICAgIF9zaG93VXBkYXRpbmc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy4kZWwuY3NzKHsgb3BhY2l0eTogMC40IH0pO1xuICAgIH0sXG5cbiAgICBfaGlkZVVwZGF0aW5nOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuJGVsLmNzcyh7IG9wYWNpdHk6IDEgfSk7XG4gICAgfVxuXG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IEFzc2lnbm1lbnQ7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgQmFzZUNvbGxlY3Rpb24gPSBmdW5jdGlvbiAobW9kZWxzLCBvcHRpb25zKSB7XG4gICAgdGhpcy5fbW9kZWxzID0gW107XG4gICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbl8uZXh0ZW5kKEJhc2VDb2xsZWN0aW9uLnByb3RvdHlwZSwge1xuICAgIGlkQXR0cmlidXRlOiAnaWQnLFxuXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24gKG1vZGVscywgb3B0aW9ucykge1xuICAgIH0sXG5cbiAgICBjcmVhdGU6IGZ1bmN0aW9uIChhdHRyLCBvcHRpb25zKSB7XG4gICAgICAgIHZhciBtID0gbmV3IHRoaXMubW9kZWwoYXR0ciwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuc2V0KG0pO1xuICAgICAgICByZXR1cm4gbTtcbiAgICB9LFxuXG4gICAgcmVzZXQ6IGZ1bmN0aW9uIChtb2RlbHMsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5fbW9kZWxzLmxlbmd0aCA9IDA7XG4gICAgICAgIHRoaXMuc2V0KG1vZGVscyk7XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKG1vZGVsKSB7XG4gICAgICAgIF8ucmVtb3ZlKHRoaXMuX21vZGVscywgZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiBtID09PSBtb2RlbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZGVsZXRlIG1vZGVsLmNvbGxlY3Rpb247XG5cbiAgICAgICAgcmV0dXJuIG1vZGVsO1xuICAgIH0sXG5cbiAgICBzZXQ6IGZ1bmN0aW9uIChtb2RlbHMpIHtcbiAgICAgICAgaWYgKCFtb2RlbHMpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIG1vZGVscyA9IFtdLmNvbmNhdChtb2RlbHMpO1xuXG4gICAgICAgIGlmICghbW9kZWxzLmxlbmd0aCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgXy5lYWNoKG1vZGVscywgZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIGlmICghKG0gaW5zdGFuY2VvZiB0aGlzLm1vZGVsKSkge1xuICAgICAgICAgICAgICAgIG0gPSBuZXcgdGhpcy5tb2RlbChtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgbS5jb2xsZWN0aW9uID0gdGhpcztcblxuICAgICAgICAgICAgdGhpcy5fbW9kZWxzLnB1c2gobSk7XG4gICAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAgIHRoaXMuc29ydC5jYWxsKHRoaXMpO1xuXG4gICAgICAgIHJldHVybiBtb2RlbHM7XG4gICAgfSxcblxuICAgIHNvcnRGbjogZnVuY3Rpb24gKGEsIGIpIHtcbiAgICAgICAgcmV0dXJuIGIuX2RhdGFbdGhpcy5pZEF0dHJpYnV0ZV0gLSBhLl9kYXRhW3RoaXMuaWRBdHRyaWJ1dGVdO1xuICAgIH0sXG5cbiAgICBzb3J0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuX21vZGVscyA9IHRoaXMuX21vZGVscy5zb3J0KHRoaXMuc29ydEZuLmJpbmQodGhpcykpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9tb2RlbHM7XG4gICAgfSxcblxuICAgIGdldEJ5SWQ6IGZ1bmN0aW9uIChpZCkge1xuICAgICAgICByZXR1cm4gXy5maW5kKHRoaXMuX21vZGVscywgZnVuY3Rpb24gKG0pIHtcbiAgICAgICAgICAgIHJldHVybiBtLmdldCh0aGlzLmlkQXR0cmlidXRlKSA9PT0gaWQ7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgIH0sXG5cbiAgICBlYWNoOiBmdW5jdGlvbiAoY2IsIGN0eCkge1xuICAgICAgICByZXR1cm4gXy5lYWNoKHRoaXMuX21vZGVscywgY2IsIGN0eCB8fCB0aGlzKTtcbiAgICB9LFxuXG4gICAgYWxsOiBmdW5jdGlvbiAoY2IsIGN0eCkge1xuICAgICAgICByZXR1cm4gXy5hbGwodGhpcy5fbW9kZWxzLCBjYiwgY3R4IHx8IHRoaXMpO1xuICAgIH0sXG5cbiAgICB0b0pTT046IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIF8uaW52b2tlKHRoaXMuX21vZGVscywgJ3RvSlNPTicpO1xuICAgIH0sXG5cbiAgICBmaW5kOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgcmV0dXJuIF8uZmluZCh0aGlzLl9tb2RlbHMsIGZuKTtcbiAgICB9LFxuXG4gICAgZmlsdGVyOiBmdW5jdGlvbiAoZm4pIHtcbiAgICAgICAgcmV0dXJuIF8uZmlsdGVyKHRoaXMuX21vZGVscywgZm4pO1xuICAgIH0sXG5cbiAgICBzaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9tb2RlbHMubGVuZ3RoO1xuICAgIH0sXG5cbiAgICBtYXA6IGZ1bmN0aW9uIChmbiwgY3R4KSB7XG4gICAgICAgIHJldHVybiBfLm1hcCh0aGlzLl9tb2RlbHMsIGZ1bmN0aW9uIChtb2RlbCkge1xuICAgICAgICAgICAgcmV0dXJuIGZuLmNhbGwoY3R4LCBtb2RlbC50b0pTT04oKSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBwbHVjazogZnVuY3Rpb24gKGZpZWxkKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAobSkge1xuICAgICAgICAgICAgcmV0dXJuIG1bZmllbGRdO1xuICAgICAgICB9KTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VDb2xsZWN0aW9uOyIsIid1c2Ugc3RyaWN0JztcblxuXG52YXIgQmFzZU1vZGVsID0gZnVuY3Rpb24gKGF0dHIsIG9wdGlvbnMpIHtcbiAgICBhdHRyID0gXy5kZWZhdWx0cyh7fSwgYXR0ciwgXy5yZXN1bHQodGhpcywgJ2RlZmF1bHRzJykpO1xuICAgIHRoaXMuX2RhdGEgPSB7fTtcbiAgICB0aGlzLnNldChhdHRyLCBvcHRpb25zKTtcbiAgICB0aGlzLmluaXRpYWxpemUuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbn07XG5cbl8uZXh0ZW5kKEJhc2VNb2RlbC5wcm90b3R5cGUsIHtcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoYXR0ciwgb3B0aW9ucykge1xuXG4gICAgfSxcblxuICAgIHNldDogZnVuY3Rpb24gKGtleSwgdmFsLCBvcHRpb25zKSB7XG5cbiAgICAgICAgaWYgKGtleSA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhdHRycztcbiAgICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICBhdHRycyA9IGtleTtcbiAgICAgICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICAgICAgfVxuXG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgICAgIF8uZXh0ZW5kKHRoaXMuX2RhdGEsIGF0dHJzKTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgZ2V0OiBmdW5jdGlvbiAoa2V5LCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kYXRhW2tleV07XG4gICAgfSxcblxuICAgIHJlbW92ZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5jb2xsZWN0aW9uKSB7XG4gICAgICAgICAgICB0aGlzLmNvbGxlY3Rpb24ucmVtb3ZlKHRoaXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIHRvSlNPTjogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGF0YTtcbiAgICB9LFxuXG4gICAgcGljazogZnVuY3Rpb24gKGtleXMpIHtcbiAgICAgICAgcmV0dXJuIF8ucGljayh0aGlzLl9kYXRhLCBrZXlzKTtcbiAgICB9XG5cbn0pO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEJhc2VNb2RlbDsiLCIndXNlIHN0cmljdCc7XG5cbnZhciBlbnYgPSB7XG4gICAgYWNjb3VudDogJycsXG4gICAgcHJvamVjdDogJycsXG4gICAgZ3JvdXA6ICcnLFxuICAgIGdyb3VwSWQ6ICcnLFxuICAgIHRva2VuOiAnJyxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgICAgaG9zdDogJ2FwaS5mb3Jpby5jb20nLFxuICAgICAgICBwcm90b2NvbDogJ2h0dHBzJ1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNldDogZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgZW52ID0gXy5tZXJnZShlbnYsIG9wdGlvbnMpO1xuICAgIH0sXG5cbiAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIGVudjtcbiAgICB9XG59OyIsIihmdW5jdGlvbiAoKSB7XG4gICAgJ3VzZSBzdHJpY3QnO1xuICAgIHZhciBBcHAgPSByZXF1aXJlKCcuL2Fzc2lnbm1lbnQuanMnKTtcblxuICAgIHdpbmRvdy5mb3JpbyA9IHdpbmRvdy5mb3JpbyB8fCB7fTtcbiAgICB3aW5kb3cuZm9yaW8uTXVsdGlwbGF5ZXJBc3NpZ25tZW50Q29tcG9uZW50ID0gQXBwO1xufSkoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtbW9kZWwnKTtcbi8vIHZhciBfX3N1cGVyID0gQmFzZS5wcm90b3R5cGU7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcblxuICAgIGlzRHluYW1pY0Fzc2lnbm1lbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KCd3b3JsZHMnKSA9PT0gJ2R5bmFtaWMnO1xuICAgIH0sXG5cbiAgICBoYXNSb2xlczogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcm9sZXMgPSB0aGlzLmdldCgncm9sZXMnKTtcbiAgICAgICAgcmV0dXJuIHJvbGVzICYmICEhcm9sZXMubGVuZ3RoO1xuICAgIH0sXG5cbiAgICBmZXRjaDogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgYXBpID0gc2VydmljZUxvY2F0b3Iud29ybGRBcGkoKTtcblxuICAgICAgICByZXR1cm4gYXBpLmdldFByb2plY3RTZXR0aW5ncygpLnRoZW4oZnVuY3Rpb24gKHNldHRpbmdzKSB7XG4gICAgICAgICAgICB0aGlzLnNldChzZXR0aW5ncyk7XG4gICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfVxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgZW52ID0gcmVxdWlyZSgnLi9kZWZhdWx0cy5qcycpO1xuXG52YXIgY2FjaGUgPSB7fTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgd29ybGRBcGk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKCFjYWNoZS53b3JsZEFwaSkge1xuICAgICAgICAgICAgY2FjaGUud29ybGRBcGkgPSBuZXcgRi5zZXJ2aWNlLldvcmxkKGVudi5nZXQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FjaGUud29ybGRBcGk7XG4gICAgfSxcblxuICAgIG1lbWJlckFwaTogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAoIWNhY2hlLm1lbWJlckFwaSkge1xuICAgICAgICAgICAgY2FjaGUubWVtYmVyQXBpID0gbmV3IEYuc2VydmljZS5NZW1iZXIoXy5waWNrKGVudi5nZXQoKSwgWydncm91cElkJywgJ3NlcnZlciddKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gY2FjaGUubWVtYmVyQXBpO1xuICAgIH0sXG5cbiAgICB1c2VyQXBpOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICghY2FjaGUudXNlckFwaSkge1xuICAgICAgICAgICAgY2FjaGUudXNlckFwaSA9IG5ldyBGLnNlcnZpY2UuVXNlcihfLnBpY2soZW52LmdldCgpLCBbJ2FjY291bnQnLCAnc2VydmVyJ10pKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBjYWNoZS51c2VyQXBpO1xuICAgIH1cbn07IiwiZXhwb3J0c1tcImVkaXQtdXNlci1yb3dcIl0gPSBmdW5jdGlvbihvYmopIHtcbm9iaiB8fCAob2JqID0ge30pO1xudmFyIF9fdCwgX19wID0gJycsIF9fZSA9IF8uZXNjYXBlLCBfX2ogPSBBcnJheS5wcm90b3R5cGUuam9pbjtcbmZ1bmN0aW9uIHByaW50KCkgeyBfX3AgKz0gX19qLmNhbGwoYXJndW1lbnRzLCAnJykgfVxud2l0aCAob2JqKSB7XG5fX3AgKz0gJzx0ZD48aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2xhc3M9XCJzZWxlY3RcIiBkYXRhLWlkPVwiJyArXG4oKF9fdCA9ICggaWQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCI8L3RkPlxcbjx0ZD48L3RkPlxcbjx0ZD5cXG4gICAgPHNlbGVjdCBuYW1lPVwid29ybGRzXCIgY2xhc3M9XCJmb3JtLWNvbnRyb2xcIiBkYXRhLWZpZWxkPVwid29ybGRcIj5cXG5cXG4gICAgJztcbiBfLmVhY2god29ybGRzLCBmdW5jdGlvbiAodykgeyA7XG5fX3AgKz0gJ1xcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIicgK1xuKChfX3QgPSAoIHcgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCIgJyArXG4oKF9fdCA9ICggdyA9PT0gd29ybGQgPyAnc2VsZWN0ZWQnIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPicgK1xuKChfX3QgPSAoIHcgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC9vcHRpb24+XFxuICAgICc7XG4gfSk7IDtcbl9fcCArPSAnXFxuICAgICAgICA8b3B0aW9uIHZhbHVlPVwiJyArXG4oKF9fdCA9ICggbmV3V29ybGQgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCIgY2xhc3M9XCJuZXctd29ybGQtdGV4dFwiPjxpPicgK1xuKChfX3QgPSAoIG5ld1dvcmxkICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJyAtIE5ldyAtPC9pPjwvb3B0aW9uPlxcbiAgICA8L3NlbGVjdD5cXG48L3RkPlxcbjx0ZD5cXG4gICAgPHNlbGVjdCBuYW1lPVwicm9sZXNcIiBjbGFzcz1cImZvcm0tY29udHJvbFwiIGRhdGEtZmllbGQ9XCJyb2xlXCI+XFxuICAgICc7XG4gXy5lYWNoKHJvbGVzLCBmdW5jdGlvbiAocikgeyA7XG5fX3AgKz0gJ1xcbiAgICAgICAgPG9wdGlvbiB2YWx1ZT1cIicgK1xuKChfX3QgPSAoIHIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCIgJyArXG4oKF9fdCA9ICggciA9PT0gcm9sZSA/ICdzZWxlY3RlZCcgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic+JyArXG4oKF9fdCA9ICggciApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L29wdGlvbj5cXG4gICAgJztcbiB9KTsgO1xuX19wICs9ICdcXG5cXG4gICAgJztcbiBfLmVhY2gob3B0aW9uYWxSb2xlcywgZnVuY3Rpb24gKHIpIHsgO1xuX19wICs9ICdcXG4gICAgICAgIDxvcHRpb24gdmFsdWU9XCInICtcbigoX190ID0gKCByICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJ1wiICcgK1xuKChfX3QgPSAoIHIgPT09IHJvbGUgPyAnc2VsZWN0ZWQnIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPicgK1xuKChfX3QgPSAoIHIgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nIDxpPihPcHRpb25hbCk8L2k+PC9vcHRpb24+XFxuICAgICc7XG4gfSk7IDtcbl9fcCArPSAnXFxuICAgIDwvc2VsZWN0PlxcbjwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIGxhc3ROYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIHVzZXJOYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoICF3b3JsZCA/ICc8ZW0gY2xhc3M9XCJmLWljb24gZi13YXJuaW5nXCI+PC9lbT4nIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQgY2xhc3M9XCJhY3Rpb25zXCI+XFxuICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLXByaW1hcnkgYnRuLXRvb2xzIGJ0bi1zYXZlIHNhdmVcIj5TYXZlPC9idXR0b24+XFxuICAgIDxidXR0b24gY2xhc3M9XCJidG4gYnRuLXRvb2xzIGJ0bi1jYW5jZWwgY2FuY2VsXCI+Q2FuY2VsPC9idXR0b24+XFxuPC90ZD4nO1xuXG59XG5yZXR1cm4gX19wXG59O1xuZXhwb3J0c1tcInVzZXItcm93XCJdID0gZnVuY3Rpb24ob2JqKSB7XG5vYmogfHwgKG9iaiA9IHt9KTtcbnZhciBfX3QsIF9fcCA9ICcnLCBfX2UgPSBfLmVzY2FwZTtcbndpdGggKG9iaikge1xuX19wICs9ICc8dGQ+PGlucHV0IHR5cGU9XCJjaGVja2JveFwiIGNsYXNzPVwic2VsZWN0XCIgZGF0YS1pZD1cIicgK1xuKChfX3QgPSAoIGlkKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nXCI8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCAhaXNXb3JsZENvbXBsZXRlID8gJzxlbSBjbGFzcz1cImYtaWNvbiBmLXdhcm5pbmdcIj48L2VtPicgOiAnJyApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCB3b3JsZCApKSA9PSBudWxsID8gJycgOiBfX3QpICtcbic8L3RkPlxcbjx0ZD4nICtcbigoX190ID0gKCByb2xlICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIGxhc3ROYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoIHVzZXJOYW1lICkpID09IG51bGwgPyAnJyA6IF9fdCkgK1xuJzwvdGQ+XFxuPHRkPicgK1xuKChfX3QgPSAoICF3b3JsZCA/ICc8ZW0gY2xhc3M9XCJmLWljb24gZi13YXJuaW5nXCI+PC9lbT4nIDogJycgKSkgPT0gbnVsbCA/ICcnIDogX190KSArXG4nPC90ZD5cXG48dGQgY2xhc3M9XCJhY3Rpb25zXCI+PGJ1dHRvbiBjbGFzcz1cImJ0biBlZGl0IGJ0bi1lZGl0IGJ0bi10b29scyBhdXRvLWhpZGVcIj5FZGl0PC9idXR0b24+PC90ZD4nO1xuXG59XG5yZXR1cm4gX19wXG59OyIsIid1c2Ugc3RyaWN0JztcblxudmFyIGNsYXNzRnJvbSA9IHJlcXVpcmUoJy4uLy4uLy4uL3V0aWwvaW5oZXJpdCcpO1xudmFyIEJhc2UgPSByZXF1aXJlKCcuL2Jhc2UtbW9kZWwnKTtcbnZhciBzZXJ2aWNlTG9jYXRvciA9IHJlcXVpcmUoJy4vc2VydmljZS1sb2NhdG9yJyk7XG5cblxubW9kdWxlLmV4cG9ydHMgPSBjbGFzc0Zyb20oQmFzZSwge1xuICAgIGRlZmF1bHRzOiB7XG4gICAgICAgIHdvcmxkOiAnJyxcbiAgICAgICAgcm9sZTogJycsXG4gICAgICAgIGFjdGl2ZTogdHJ1ZSxcbiAgICAgICAgaXNXb3JsZENvbXBsZXRlOiB0cnVlXG4gICAgfSxcblxuICAgIG1ha2VBY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lbWJlckFwaSA9IHNlcnZpY2VMb2NhdG9yLm1lbWJlckFwaSgpO1xuICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgdXNlcklkOiB0aGlzLmdldCgnaWQnKSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IHRoaXMuZ2V0KCdncm91cElkJylcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLmdldCgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCB0cnVlKTtcblxuICAgICAgICByZXR1cm4gbWVtYmVyQXBpLm1ha2VVc2VyQWN0aXZlKHBhcmFtcylcbiAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBvcmlnaW5hbCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0sXG5cbiAgICBtYWtlSW5hY3RpdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIG1lbWJlckFwaSA9IHNlcnZpY2VMb2NhdG9yLm1lbWJlckFwaSgpO1xuICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgdXNlcklkOiB0aGlzLmdldCgnaWQnKSxcbiAgICAgICAgICAgIGdyb3VwSWQ6IHRoaXMuZ2V0KCdncm91cElkJylcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgb3JpZ2luYWwgPSB0aGlzLmdldCgnYWN0aXZlJyk7XG4gICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBmYWxzZSk7XG5cbiAgICAgICAgcmV0dXJuIG1lbWJlckFwaS5tYWtlVXNlckluYWN0aXZlKHBhcmFtcylcbiAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAvLyByZXZlcnQgdGhlIGNoYW5nZVxuICAgICAgICAgICAgICAgIHRoaXMuc2V0KCdhY3RpdmUnLCBvcmlnaW5hbCk7XG4gICAgICAgICAgICB9LmJpbmQodGhpcykpO1xuICAgIH1cblxufSk7XG4iLCIndXNlIHN0cmljdCc7XG5cbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcblxudmFyIE1vZGVsID0gcmVxdWlyZSgnLi91c2VyLW1vZGVsJyk7XG52YXIgQmFzZSA9IHJlcXVpcmUoJy4vYmFzZS1jb2xsZWN0aW9uJyk7XG52YXIgZW52ID0gcmVxdWlyZSgnLi9kZWZhdWx0cycpO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcblxuXG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBtb2RlbDogTW9kZWwsXG5cbiAgICBzb3J0Rm46IGZ1bmN0aW9uIChhLCBiKSB7XG4gICAgICAgIHZhciBhdyA9IGEuZ2V0KCd3b3JsZCcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIHZhciBidyA9IGIuZ2V0KCd3b3JsZCcpLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgIGlmIChhdyAhPT0gYncpIHtcbiAgICAgICAgICAgIHJldHVybiBhdyA8IGJ3ID8gLTEgOiAxO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGIuZ2V0KCd1c2VyTmFtZScpID4gYS5nZXQoJ3VzZXJOYW1lJykgPyAtMSA6IDE7XG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgIEF1dGhvcml6YXRpb246ICdCZWFyZXIgJyArIGVudi5nZXQoKS50b2tlblxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgYWxsVXNlcnNBc3NpZ25lZDogZnVuY3Rpb24gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5hbGwoZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiAhIXUuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgZ2V0VW5hc3NpZ25lZFVzZXJzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmlsdGVyKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICByZXR1cm4gIXUuZ2V0KCd3b3JsZCcpO1xuICAgICAgICB9KS5sZW5ndGg7XG4gICAgfSxcblxuICAgIGZldGNoOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgIHZhciBncm91cElkID0gZW52LmdldCgpLmdyb3VwSWQ7XG5cbiAgICAgICAgdmFyIGdldEdyb3VwVXNlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgbWVtYmVyQXBpID0gc2VydmljZUxvY2F0b3IubWVtYmVyQXBpKCk7XG4gICAgICAgICAgICB2YXIgdXNlckFwaSA9IHNlcnZpY2VMb2NhdG9yLnVzZXJBcGkoKTtcblxuICAgICAgICAgICAgdmFyIGxvYWRHcm91cE1lbWJlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1lbWJlckFwaS5nZXRHcm91cERldGFpbHMoKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHZhciBsb2FkVXNlcnNJbmZvID0gZnVuY3Rpb24gKGdyb3VwKSB7XG4gICAgICAgICAgICAgICAgdmFyIG5vbkZhY0FuZEFjdGl2ZSA9IGZ1bmN0aW9uICh1KSB7IHJldHVybiB1LmFjdGl2ZSAmJiB1LnJvbGUgIT09ICdmYWNpbGl0YXRvcic7IH07XG4gICAgICAgICAgICAgICAgdmFyIHVzZXJzID0gXy5wbHVjayhfLmZpbHRlcihncm91cC5tZW1iZXJzLCBub25GYWNBbmRBY3RpdmUpLCAndXNlcklkJyk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHVzZXJBcGkuZ2V0KHsgaWQ6IHVzZXJzIH0pO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIGxvYWRHcm91cE1lbWJlcnMoKVxuICAgICAgICAgICAgICAgIC50aGVuKGxvYWRVc2Vyc0luZm8pXG4gICAgICAgICAgICAgICAgLmZhaWwoZHRkLnJlamVjdCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZ2V0R3JvdXBVc2VycygpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAodXNlcnMpIHtcbiAgICAgICAgICAgICAgICB1c2VycyA9IF8ubWFwKHVzZXJzLCBmdW5jdGlvbiAodSkgeyByZXR1cm4gXy5leHRlbmQodSwgeyBncm91cElkOiBncm91cElkIH0pOyB9KTtcbiAgICAgICAgICAgICAgICBfdGhpcy5zZXQodXNlcnMpO1xuICAgICAgICAgICAgICAgIGR0ZC5yZXNvbHZlKHVzZXJzLCBfdGhpcyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9XG5cbn0pO1xuIiwiJ3VzZSBzdHJpY3QnO1xudmFyIHNlcnZpY2VMb2NhdG9yID0gcmVxdWlyZSgnLi9zZXJ2aWNlLWxvY2F0b3InKTtcbnZhciBjbGFzc0Zyb20gPSByZXF1aXJlKCcuLi8uLi8uLi91dGlsL2luaGVyaXQnKTtcbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLW1vZGVsJyk7XG52YXIgX19zdXBlciA9IEJhc2UucHJvdG90eXBlO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGNsYXNzRnJvbShCYXNlLCB7XG5cbiAgICBkZWZhdWx0czoge1xuICAgICAgICB1c2VyczogbnVsbCxcbiAgICAgICAgbW9kZWw6ICdtb2RlbC5lcW4nXG4gICAgfSxcblxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgX19zdXBlci5pbml0aWFsaXplLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgdGhpcy5fZGF0YS51c2VycyA9IHRoaXMuX2RhdGEudXNlcnMgfHwgW107XG5cbiAgICAgICAgdGhpcy5fd29ybGRBcGkgPSBzZXJ2aWNlTG9jYXRvci53b3JsZEFwaSgpO1xuXG4gICAgICAgIHZhciBpZCA9IHRoaXMuZ2V0KCdpZCcpO1xuICAgICAgICBpZiAoaWQpIHtcbiAgICAgICAgICAgIHRoaXMuX3dvcmxkQXBpLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgYWRkVXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgdmFyIHVzZXJzID0gdGhpcy5nZXQoJ3VzZXJzJyk7XG4gICAgICAgIHVzZXJzLnB1c2godXNlcik7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuc2F2ZSgpO1xuICAgIH0sXG5cbiAgICByZW1vdmVVc2VyOiBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB2YXIgaWQgPSB0aGlzLmdldCgnaWQnKTtcbiAgICAgICAgdmFyIGNoZWNrV29ybGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMuZ2V0KCd1c2VycycpLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3dvcmxkQXBpLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSkuZGVsZXRlKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0uYmluZCh0aGlzKTtcblxuICAgICAgICBfLnJlbW92ZSh0aGlzLmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgIHJldHVybiB1LmdldCgnaWQnKSA9PT0gdXNlci5nZXQoJ2lkJyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl93b3JsZEFwaVxuICAgICAgICAgICAgLnVwZGF0ZUNvbmZpZyh7IGZpbHRlcjogaWQgfSlcbiAgICAgICAgICAgIC5yZW1vdmVVc2VyKHsgdXNlcklkOiB1c2VyLmdldCgnaWQnKSB9KVxuICAgICAgICAgICAgLnRoZW4oY2hlY2tXb3JsZCk7XG4gICAgfSxcblxuICAgIHNhdmU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgdmFyIG1hcFVzZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuIF8ubWFwKHRoaXMuZ2V0KCd1c2VycycpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgICAgIHZhciByZXMgPSB7IHVzZXJJZDogdS5nZXQoJ2lkJykgfTtcbiAgICAgICAgICAgICAgICB2YXIgcm9sZSA9IHUuZ2V0KCdyb2xlJyk7XG5cbiAgICAgICAgICAgICAgICBpZiAocm9sZSkge1xuICAgICAgICAgICAgICAgICAgICByZXMucm9sZSA9IHJvbGU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlcztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LmJpbmQodGhpcyk7XG5cbiAgICAgICAgdmFyIGNyZWF0ZVdvcmxkID0gXy5wYXJ0aWFsKHRoaXMuX3dvcmxkQXBpLmNyZWF0ZSwgdGhpcy5waWNrKFsnbW9kZWwnLCAnbmFtZScsICdtaW5Vc2VycyddKSk7XG4gICAgICAgIHZhciBhZGRVc2VycyA9IF8ucGFydGlhbChfdGhpcy5fd29ybGRBcGkuYWRkVXNlcnMsIG1hcFVzZXJzKCksIHsgZmlsdGVyOiBfdGhpcy5nZXQoJ2lkJykgfSk7XG4gICAgICAgIHZhciBzYXZlZFVzZXJzID0gdGhpcy5nZXQoJ3VzZXJzJyk7XG4gICAgICAgIGlmICh0aGlzLmlzTmV3KCkpIHtcbiAgICAgICAgICAgIC8vIHdlIG5lZWQgdG8gY3JlYXRlIHRoZSB3b3JsZCBpbiB0aGUgQVBJIGFuZCB0aGVuIGFkZCB0aGUgdXNlcnNcbiAgICAgICAgICAgIHJldHVybiBjcmVhdGVXb3JsZCgpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkKSB7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLnNldCh3b3JsZCk7XG4gICAgICAgICAgICAgICAgICAgIF90aGlzLl93b3JsZEFwaS51cGRhdGVDb25maWcoeyBmaWx0ZXI6IHdvcmxkLmlkIH0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oYWRkVXNlcnMpXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHVzZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNpbmNlIHdlIHJlLXNldCB0aGUgd29ybGQsIHJlLXNldCB0aGUgdXNlcnNcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuc2V0KCd1c2VycycsIHNhdmVkVXNlcnMpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhlIHdvcmxkIGlzIGFscmVhZHkgY3JlYXRlZCBqdXN0IGFkZCB0aGUgdXNlcnNcbiAgICAgICAgICAgIHJldHVybiBhZGRVc2VycygpO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGlzTmV3OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiAhdGhpcy5nZXQoJ2xhc3RNb2RpZmllZCcpO1xuICAgIH1cblxufSk7IiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgY2xhc3NGcm9tID0gcmVxdWlyZSgnLi4vLi4vLi4vdXRpbC9pbmhlcml0Jyk7XG52YXIgTW9kZWwgPSByZXF1aXJlKCcuL3dvcmxkLW1vZGVsJyk7XG52YXIgVXNlck1vZGVsID0gcmVxdWlyZSgnLi91c2VyLW1vZGVsJyk7XG52YXIgc2VydmljZUxvY2F0b3IgPSByZXF1aXJlKCcuL3NlcnZpY2UtbG9jYXRvcicpO1xuXG5cbnZhciBCYXNlID0gcmVxdWlyZSgnLi9iYXNlLWNvbGxlY3Rpb24nKTtcbnZhciBfX3N1cGVyID0gQmFzZS5wcm90b3R5cGU7XG5cbnZhciBkb25lRm4gPSBmdW5jdGlvbiAoZHRkLCBhZnRlcikge1xuICAgIHJldHVybiBfLmFmdGVyKGFmdGVyLCBkdGQucmVzb2x2ZSk7XG59O1xuXG52YXIgd29ybGRBcGk7XG5cbm1vZHVsZS5leHBvcnRzID0gY2xhc3NGcm9tKEJhc2UsIHtcbiAgICBtb2RlbDogTW9kZWwsXG5cbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIF9fc3VwZXIuaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgICAgICB3b3JsZEFwaSA9IHNlcnZpY2VMb2NhdG9yLndvcmxkQXBpKCk7XG4gICAgfSxcblxuICAgIGF1dG9Bc3NpZ25BbGw6IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB3b3JsZEFwaS5hdXRvQXNzaWduKG9wdGlvbnMpXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbiAod29ybGRzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXNldCh0aGlzLnBhcnNlKHdvcmxkcykpO1xuICAgICAgICAgICAgfS5iaW5kKHRoaXMpKTtcbiAgICB9LFxuXG4gICAgZ2V0SW5jb21wbGV0ZVdvcmxkc0NvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmZpbHRlcihmdW5jdGlvbiAodykge1xuICAgICAgICAgICAgcmV0dXJuICF3LmdldCgnY29tcGxldGUnKTtcbiAgICAgICAgfSkubGVuZ3RoO1xuICAgIH0sXG5cbiAgICB1cGRhdGVVc2VyOiBmdW5jdGlvbiAodXNlcikge1xuICAgICAgICB2YXIgd29ybGROYW1lID0gdXNlci5nZXQoJ3dvcmxkJyk7XG4gICAgICAgIHZhciBkdGQgPSAkLkRlZmVycmVkKCk7XG4gICAgICAgIHZhciBwcmV2V29ybGQgPSB0aGlzLmdldFdvcmxkQnlVc2VyKHVzZXIpO1xuICAgICAgICB2YXIgY3VyV29ybGQgPSB0aGlzLmdldE9yQ3JlYXRlV29ybGQod29ybGROYW1lKTtcbiAgICAgICAgdmFyIGRvbmUgPSBkb25lRm4oZHRkLCAxKTtcblxuICAgICAgICAvLyBjaGVjayBpZiB0aGVyZSdzIGFueXRoaW5nIHRvIGRvXG4gICAgICAgIGlmICghcHJldldvcmxkICYmICFjdXJXb3JsZCkge1xuICAgICAgICAgICAgcmV0dXJuIGR0ZC5yZXNvbHZlKCkucHJvbWlzZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHByZXZXb3JsZCkge1xuICAgICAgICAgICAgcHJldldvcmxkLnJlbW92ZVVzZXIodXNlcilcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChjdXJXb3JsZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGN1cldvcmxkLmFkZFVzZXIodXNlcik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGRvbmUpO1xuICAgICAgICB9IGVsc2UgaWYgKGN1cldvcmxkKSB7XG4gICAgICAgICAgICBjdXJXb3JsZC5hZGRVc2VyKHVzZXIpXG4gICAgICAgICAgICAgICAgLnRoZW4oZG9uZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZHRkLnByb21pc2UoKTtcbiAgICB9LFxuXG4gICAgZ2V0T3JDcmVhdGVXb3JsZDogZnVuY3Rpb24gKHdvcmxkTmFtZSkge1xuICAgICAgICBpZiAoIXdvcmxkTmFtZSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIHdvcmxkID0gdGhpcy5nZXRXb3JkQnlOYW1lKHdvcmxkTmFtZSk7XG5cbiAgICAgICAgaWYgKCF3b3JsZCkge1xuICAgICAgICAgICAgd29ybGQgPSB0aGlzLmNyZWF0ZSh7IG5hbWU6IHdvcmxkTmFtZSB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB3b3JsZDtcbiAgICB9LFxuXG4gICAgZ2V0V29yZEJ5TmFtZTogZnVuY3Rpb24gKHdvcmxkTmFtZSkge1xuICAgICAgICByZXR1cm4gdGhpcy5maW5kKGZ1bmN0aW9uICh3b3JsZCkge1xuICAgICAgICAgICAgcmV0dXJuIHdvcmxkLmdldCgnbmFtZScpID09PSB3b3JsZE5hbWU7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRXb3JsZEJ5VXNlcjogZnVuY3Rpb24gKHVzZXIpIHtcbiAgICAgICAgaWYgKCF1c2VyLmdldCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdnZXRXb3JsZEJ5VXNlciBleHBlY3RlcyBhIG1vZGVsICgnICsgdXNlciArICcpJyk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaWQgPSB1c2VyLmdldCgnaWQnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZ2V0V29ybGRCeVVzZXJJZChpZCk7XG4gICAgfSxcblxuICAgIGdldFdvcmxkQnlVc2VySWQ6IGZ1bmN0aW9uICh1c2VySWQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZmluZChmdW5jdGlvbiAod29ybGQpIHtcbiAgICAgICAgICAgIHJldHVybiBfLmZpbmQod29ybGQuZ2V0KCd1c2VycycpLCBmdW5jdGlvbiAodSkge1xuICAgICAgICAgICAgICAgIHJldHVybiB1LmdldCgnaWQnKSA9PT0gdXNlcklkO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBnZXRXb3JsZE5hbWVzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnBsdWNrKCduYW1lJyk7XG4gICAgfSxcblxuICAgIGdldE5leHRXb3JsZE5hbWU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHBhZCA9IGZ1bmN0aW9uIChudW0sIHBsYWNlcykge1xuICAgICAgICAgICAgdmFyIHplcm9zID0gJzAwMDAwMDAwMDAwMDAwMDAwMCc7XG4gICAgICAgICAgICB2YXIgZGlnaXRzID0gbnVtLnRvU3RyaW5nKCkubGVuZ3RoO1xuICAgICAgICAgICAgdmFyIG5lZWRlZCA9IHBsYWNlcyAtIGRpZ2l0cztcbiAgICAgICAgICAgIHJldHVybiB6ZXJvcy5zdWJzdHIoMCwgbmVlZGVkKSArIG51bTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgd29ybGRzID0gdGhpcy5nZXRXb3JsZE5hbWVzKCk7XG5cbiAgICAgICAgaWYgKCF3b3JsZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICByZXR1cm4gJ1dvcmxkMDAxJztcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm9wZXJOYW1lcyA9IF8uZmlsdGVyKHdvcmxkcywgZnVuY3Rpb24gKHcpIHsgcmV0dXJuIC9Xb3JsZFxcZFxcZFxcZC8udGVzdCh3KTsgfSkuc29ydCgpO1xuICAgICAgICB2YXIgbGFzdFdvcmxkID0gcHJvcGVyTmFtZXNbcHJvcGVyTmFtZXMubGVuZ3RoIC0gMV07XG4gICAgICAgIHZhciBudW1Xb3JsZCA9ICtsYXN0V29ybGQubWF0Y2goL1dvcmxkKFxcZFxcZFxcZCkvKVsxXTtcbiAgICAgICAgcmV0dXJuICdXb3JsZCcgKyBwYWQobnVtV29ybGQgKyAxLCAzKTtcbiAgICB9LFxuXG4gICAgc2V0VXNlcnNDb2xsZWN0aW9uOiBmdW5jdGlvbiAodXNlcnNDb2xsZWN0aW9uKSB7XG4gICAgICAgIHRoaXMudXNlcnNDb2xsZWN0aW9uID0gdXNlcnNDb2xsZWN0aW9uO1xuICAgIH0sXG5cbiAgICBqb2luVXNlcnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVzZXJzSGFzaCA9IHt9O1xuICAgICAgICB2YXIgdXNlcnNDb2xsZWN0aW9uID0gdGhpcy51c2Vyc0NvbGxlY3Rpb247XG4gICAgICAgIHVzZXJzQ29sbGVjdGlvbi5lYWNoKGZ1bmN0aW9uICh1KSB7XG4gICAgICAgICAgICB1LnNldCh7IGlzV29ybGRDb21wbGV0ZTogdHJ1ZSB9KTtcbiAgICAgICAgICAgIHJldHVybiAodXNlcnNIYXNoW3UuZ2V0KCdpZCcpXSA9IHUpO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmVhY2goZnVuY3Rpb24gKHcsIGkpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gdy5nZXQoJ25hbWUnKTtcbiAgICAgICAgICAgIHZhciBpc0NvbXBsZXRlID0gdy5nZXQoJ2NvbXBsZXRlJyk7XG4gICAgICAgICAgICB3LnNldCh7IGluZGV4OiBpLCBuYW1lOiBuYW1lIHx8IChpICsgMSkgKyAnJyB9KTtcbiAgICAgICAgICAgIF8uZWFjaCh3LmdldCgndXNlcnMnKSwgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICBpZiAodXNlcnNIYXNoW3UuZ2V0KCd1c2VySWQnKV0pIHtcbiAgICAgICAgICAgICAgICAgICAgdXNlcnNIYXNoW3UuZ2V0KCd1c2VySWQnKV0uc2V0KHsgd29ybGQ6IG5hbWUsIHJvbGU6IHUuZ2V0KCdyb2xlJyksIGlzV29ybGRDb21wbGV0ZTogaXNDb21wbGV0ZSB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSwgdGhpcyk7XG5cbiAgICAgICAgdXNlcnNDb2xsZWN0aW9uLnNvcnQoKTtcbiAgICB9LFxuXG4gICAgZmV0Y2g6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgcmV0dXJuIHdvcmxkQXBpLmxpc3QoKVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24gKHdvcmxkcykge1xuICAgICAgICAgICAgICAgIHRoaXMucmVzZXQodGhpcy5wYXJzZSh3b3JsZHMpKTtcbiAgICAgICAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSxcblxuICAgIHBhcnNlOiBmdW5jdGlvbiAod29ybGRzKSB7XG4gICAgICAgIGlmICh3b3JsZHMubGVuZ3RoKSB7XG4gICAgICAgICAgICB3b3JsZHMgPSBfLm1hcCh3b3JsZHMsIGZ1bmN0aW9uICh3KSB7XG4gICAgICAgICAgICAgICAgdmFyIHVzZXJzID0gXy5tYXAody51c2VycywgZnVuY3Rpb24gKHUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaW4gdGhlIHdvcmxkIGFwaSB1c2VycyBJZHMgY29tZXMgYXMgdXNlcklkXG4gICAgICAgICAgICAgICAgICAgIC8vIG1ha2Ugc3VyZSB3ZSBhZGQgaXQgYXMgaWQgc28gd2UgY2FuIHVzZSB0aGVcbiAgICAgICAgICAgICAgICAgICAgLy8gc2FtZSBjb2RlIHRvIGFjY2VzcyBtb2RlbHMgdGhhdCBjb21lIGZyb20gdGhlXG4gICAgICAgICAgICAgICAgICAgIC8vIG1lbWJlci9sb2NhbCBhcGkgYXMgd2l0aCB0aGUgd29ybGQgYXBpXG4gICAgICAgICAgICAgICAgICAgIHUuaWQgPSB1LnVzZXJJZDtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBVc2VyTW9kZWwodSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB3LnVzZXJzID0gdXNlcnM7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHdvcmxkcztcbiAgICB9XG59KTsiLCIndXNlIHN0cmljdCc7XG5cbi8qKlxuKiBVdGlsaXR5IGNsYXNzIHRvIG1ha2UgYWpheCBjYWxscyBzZXF1ZW5jaWFsXG4qL1xuZnVuY3Rpb24gQWpheFF1ZXVlICgpIHtcbiAgICB0aGlzLnF1ZXVlID0gW107XG59XG5cbiQuZXh0ZW5kKEFqYXhRdWV1ZS5wcm90b3R5cGUsIHtcbiAgICBhZGQ6IGZ1bmN0aW9uIChmbikge1xuICAgICAgICByZXR1cm4gdGhpcy5xdWV1ZS5wdXNoKGZuKTtcbiAgICB9LFxuXG4gICAgZXhlY3V0ZTogZnVuY3Rpb24gKGNvbnRleHQpIHtcbiAgICAgICAgdmFyIGR0ZCA9ICQuRGVmZXJyZWQoKTtcbiAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQgfHwgdGhpcztcblxuICAgICAgICBmdW5jdGlvbiBuZXh0KCkge1xuICAgICAgICAgICAgaWYgKF90aGlzLnF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgIHZhciBmbiA9IF90aGlzLnF1ZXVlLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICBmbi5jYWxsKGNvbnRleHQpXG4gICAgICAgICAgICAgICAgICAgIC50aGVuKG5leHQpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGR0ZC5yZWplY3QpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBkdGQucmVzb2x2ZSgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgbmV4dCgpO1xuXG4gICAgICAgIHJldHVybiBkdGQucHJvbWlzZSgpO1xuICAgIH1cbn0pO1xuXG5cbm1vZHVsZS5leHBvcnRzID0gQWpheFF1ZXVlOyIsIi8qKlxuLyogSW5oZXJpdCBmcm9tIGEgY2xhc3MgKHVzaW5nIHByb3RvdHlwZSBib3Jyb3dpbmcpXG4qL1xuJ3VzZSBzdHJpY3QnO1xuXG5mdW5jdGlvbiBpbmhlcml0KEMsIFApIHtcbiAgICB2YXIgRiA9IGZ1bmN0aW9uICgpIHt9O1xuICAgIEYucHJvdG90eXBlID0gUC5wcm90b3R5cGU7XG4gICAgQy5wcm90b3R5cGUgPSBuZXcgRigpO1xuICAgIEMuX19zdXBlciA9IFAucHJvdG90eXBlO1xuICAgIEMucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gQztcbn1cblxuLyoqXG4qIFNoYWxsb3cgY29weSBvZiBhbiBvYmplY3RcbiovXG52YXIgZXh0ZW5kID0gZnVuY3Rpb24gKGRlc3QgLyosIHZhcl9hcmdzKi8pIHtcbiAgICB2YXIgb2JqID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTtcbiAgICB2YXIgY3VycmVudDtcbiAgICBmb3IgKHZhciBqID0gMDsgajxvYmoubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKCEoY3VycmVudCA9IG9ialtqXSkpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZG8gbm90IHdyYXAgaW5uZXIgaW4gZGVzdC5oYXNPd25Qcm9wZXJ0eSBvciBiYWQgdGhpbmdzIHdpbGwgaGFwcGVuXG4gICAgICAgIC8qanNoaW50IC1XMDg5ICovXG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjdXJyZW50KSB7XG4gICAgICAgICAgICBkZXN0W2tleV0gPSBjdXJyZW50W2tleV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZGVzdDtcbn07XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKGJhc2UsIHByb3BzLCBzdGF0aWNQcm9wcykge1xuICAgIHZhciBwYXJlbnQgPSBiYXNlO1xuICAgIHZhciBjaGlsZDtcblxuICAgIGNoaWxkID0gcHJvcHMgJiYgcHJvcHMuaGFzT3duUHJvcGVydHkoJ2NvbnN0cnVjdG9yJykgPyBwcm9wcy5jb25zdHJ1Y3RvciA6IGZ1bmN0aW9uICgpIHsgcmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuXG4gICAgLy8gYWRkIHN0YXRpYyBwcm9wZXJ0aWVzIHRvIHRoZSBjaGlsZCBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgIGV4dGVuZChjaGlsZCwgcGFyZW50LCBzdGF0aWNQcm9wcyk7XG5cbiAgICAvLyBhc3NvY2lhdGUgcHJvdG90eXBlIGNoYWluXG4gICAgaW5oZXJpdChjaGlsZCwgcGFyZW50KTtcblxuICAgIC8vIGFkZCBpbnN0YW5jZSBwcm9wZXJ0aWVzXG4gICAgaWYgKHByb3BzKSB7XG4gICAgICAgIGV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBkb25lXG4gICAgcmV0dXJuIGNoaWxkO1xufTtcbiJdfQ==
