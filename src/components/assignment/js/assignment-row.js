const userRowTemplate = `
    <td><input type="checkbox" class="select" data-id="<%= id%>"</td>
    <td><%= !isWorldComplete ? '<em class="f-icon f-warning"></em>' : '' %></td>
    <td><%= world %></td>
    <td><%= role %></td>
    <td><%= lastName %></td>
    <td><%= userName %></td>
    <td><%= !world ? '<em class="f-icon f-warning"></em>' : '' %></td>
    <td class="actions"><button class="btn edit btn-edit btn-tools auto-hide">Edit</button></td>
`.trim();
const editUserRowTemplate = `
    <td><input type="checkbox" class="select" data-id="<%= id %>"</td>
    <td></td>
    <td>
        <select name="worlds" class="form-control" data-field="world">

        <% _.each(worlds, function (w) { %>
            <option value="<%= w %>" <%= w === world ? 'selected' : '' %>><%= w %></option>
        <% }); %>
            <option value="<%= newWorld %>" class="new-world-text"><i><%= newWorld %> - New -</i></option>
        </select>
    </td>
    <td>
        <select name="roles" class="form-control" data-field="role">
        <% _.each(roles, function (r) { %>
            <option value="<%= r %>" <%= r === role ? 'selected' : '' %>><%= r %></option>
        <% }); %>

        <% _.each(optionalRoles, function (r) { %>
            <option value="<%= r %>" <%= r === role ? 'selected' : '' %>><%= r %> <i>(Optional)</i></option>
        <% }); %>
        </select>
    </td>
    <td><%= lastName %></td>
    <td><%= userName %></td>
    <td><%= !world ? '<em class="f-icon f-warning"></em>' : '' %></td>
    <td class="actions">
        <button class="btn btn-primary btn-tools btn-save save">Save</button>
        <button class="btn btn-tools btn-cancel cancel">Cancel</button>
    </td>
`;

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

    template: _.template(userRowTemplate),
    editTemplate: _.template(editUserRowTemplate),

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


export default AssignmentRow;