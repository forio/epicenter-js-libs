'use strict';

var UsersCollection = require('./users-collection');
var WorldsCollection = require('./worlds-collection');
var AssignemntRow = require('./assignment-row');

var Assignment = function (options) {
    this.initialize(options);
};

Assignment.prototype = {

    initialize: function (options) {
        this.el = typeof options.el === 'string' ? $(options.el)[0] : options.el;
        this.$el = $(this.el);
        this.$ = _.partialRight($, this.el);

        this.users = new UsersCollection();
        this.worlds = new WorldsCollection();

        _.bindAll(this, ['render', 'renderTable', 'toggleControlls', 'saveEdit', 'selectAll', 'usassignSelected', '_showUpdating', '_hideUpdating', 'autoAssign']);

        this.bindEvents();
    },

    bindEvents: function () {
        this.$el.on('click', 'button.save', this.saveEdit);
        this.$el.on('click', 'input:checkbox:not(#select-all)', this.toggleControlls);
        this.$el.on('click', '#select-all', this.selectAll);
        this.$el.on('click', '.unassign-user', this.usassignSelected);
        this.$el.on('click', '.auto-assign-all', this.autoAssignAll);
    },

    load: function () {
        var join = _.after(2, function () {
            this.worlds.joinUsers(this.users);

            this.render();
        }.bind(this));

        this.worlds.fetch().then(join);
        this.users.fetch().then(join);
    },

    saveEdit: function () {
        this.updateControls();
    },

    autoAssignAll: function () {
        this._showUpdating();
        return this.worlds.autoAssignAll()
            .done(this._hideUpdating);
    },

    usassignSelected: function (e) {
        e.preventDefault();

        var ids = this.$('tbody :checkbox:checked').map(function () {
            return $(this).data('id');
        });

        var done = _.after(ids.length, function () {
            this._hideUpdating();
            this.render();
        }.bind(this));

        this._showUpdating();
        _.each(ids, function (userId) {
            var user = this.users.getById(userId);
            user.set('world', '');
            user.set('role', '');
            this.worlds.updateUser(user).done(done);
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
            var view = new AssignemntRow({ model: u, worlds: this.worlds });
            rows.push(view.render().el);
        }, this);

        this.$('table tbody').append(rows);
    },


    updateControls: function () {
        this.updateControlsForSelection();
        this.updateAutoAssignButton();
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
        if (this.users.allUsersAssigned()) {
            this.$('.table-controls').hide();
        } else {
            this.$('.table-controls').show();
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