'use strict';

var UsersCollection = require('./users-collection');
var AssignemntRow = require('./assignment-row');

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

        var rows = [];
        this.users.each(function (u) {
            var view = new AssignemntRow({ model: u });
            rows.push(view.render().el);
        });

        this.$('table tbody').append(rows);
    }

};

module.exports = Assignment;