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

        _.bindAll(this, ['render', 'renderTable', 'toggleControlls', 'saveEdit', 'selectAll', 'usassignSelected']);

        this.bindEvents();
    },

    bindEvents: function () {
        this.$el.on('click', 'button.save', this.saveEdit);
        this.$el.on('click', 'input:checkbox:not(#select-all)', this.toggleControlls);
        this.$el.on('click', '#select-all', this.selectAll);
        this.$el.on('click', '.unassign-user', this.usassignSelected);
    },

    load: function () {
        var join = _.after(2, function () {
            this.worlds.joinUsers(this.users);

            this.render();
        }.bind(this));

        this.worlds.fetch().then(join);
        this.users.fetch().then(join);
    },

    updateControls: function () {
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

    saveEdit: function () {

    },

    usassignSelected: function (e) {
        e.preventDefault();

        var ids = this.$('tbody :checkbox:checked').map(function () {
            return $(this).data('id');
        });

        var showUpdating = function () {
            this.$el.css({ opacity: 0.4 });
        }.bind(this);

        var done = _.after(ids.length, function () {
            this.$el.css({ opacity: 1 });
            this.render();
        }.bind(this));

        showUpdating();
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
    }

};

module.exports = Assignment;