'use strict';

var UsersCollection = require('./users-collection');
var WorldsCollection = require('./worlds-collection');
var ProjectModel = require('./project-model');
var AssignemntRow = require('./assignment-row');
var env = require('./defaults');

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

        _.bindAll(this, ['render', 'renderTable', 'toggleControlls', 'saveEdit', 'selectAll', 'usassignSelected', '_showUpdating', '_hideUpdating', 'autoAssignAll']);

        this.bindEvents();
    },

    bindEvents: function () {
        this.$el.on('update', 'tr', this.saveEdit);
        this.$el.on('click', 'input:checkbox:not(#select-all)', this.toggleControlls);
        this.$el.on('click', '#select-all', this.selectAll);
        this.$el.on('click', '.unassign-user', this.usassignSelected);
        this.$el.on('click', '.auto-assign-all', this.autoAssignAll);
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

    usassignSelected: function (e) {
        e.preventDefault();

        var ids = this.$('tbody :checkbox:checked').map(function () {
            return $(this).data('id');
        });

        var done = _.after(ids.length, function () {
            this.worlds.fetch().then(function () {
                this.worlds.joinUsers();
                this._hideUpdating();
                this.render();

            }.bind(this));
        }.bind(this));

        this._showUpdating();
        _.each(ids, function (userId) {
            var user = this.users.getById(userId);
            user.set('world', '');
            user.set('role', '');
            this.worlds.updateUser(user)
                .done(done);
        }, this);
    },

    render: function () {
        this.$('table tbody').empty();
        this.renderTable();
        this.toggleControlls();
    },

    renderTable: function () {
        var rows = [];
        this.users.each(function (u) {
            var view = new AssignemntRow({ model: u, worlds: this.worlds, project: this.project });
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
        var totalWorlds = this.worlds.length();

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

        this.$('.status-widget').css({ opacity: 1 });
    },

    updateControlsForSelection: function () {
        if (this.$('tbody :checkbox:checked').length) {
            this.$('.component.controls').css({
                opacity: 1,
            });
        } else {
            this.$('.component.controls').css({
                opacity: 0,
            });
        }
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
            this.$('.table-controls').css({ opacity: 0 });
        } else {
            this.$('.table-controls').css({ opacity: 1 });
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