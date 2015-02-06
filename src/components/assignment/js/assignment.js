'use strict';

var templates = require('./templates');
var UsersCollection = require('./users-collection');

var Assignment = function (options) {
    this.initialize(options);
};

Assignment.prototype = {

    initialize: function (options) {
        this.el = options.el;
        this.$el = $(this.el);
        this.$ = _.partialRight($, this.el);

        this.users = new UsersCollection();

        _.bindAll(this, ['render', 'renderTable']);

    },

    bindEvents: function () {

    },

    load: function () {
        return this.users.fetch()
            .then(this.render);
    },

    render: function () {
        this.renderTable();
    },

    renderTable: function () {
        var rowTemplate = templates.userRow;

        var rows = [];
        this.users.each(function (u) {
            rows.push(rowTemplate(u.toJSON()));
        });

        this.$('table tbody').html(rows.join(''));
    }

};

module.exports = Assignment;