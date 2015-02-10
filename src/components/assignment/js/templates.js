
// jshint multistr:true

module.exports = {
    userRow: _.template('\
        <td><input type="checkbox" class="select" data-id="<%= id%>"</td>\
        <td><%= world %></td>\
        <td><%= role %></td>\
        <td><%= lastName %></td>\
        <td><%= userName %></td>\
        <td></td>\
        <td class="actions"><button class="btn edit auto-hide">Edit</button></td>\
        \
    '),

    editUserRow: _.template('\
        <td><input type="checkbox" class="select" data-id="<%= id%>"</td>\
        <td>\
            <input type="text" value="<%= world %>">\
        </td>\
        <td>\
            <input type="text" value="<%= role %>">\
        </td>\
        <td><%= lastName %></td>\
        <td><%= userName %></td>\
        <td></td>\
        <td class="actions">\
            <button class="btn btn-primary save">Save</button>\
            <button class="btn cancel">Cancel</button>\
        </td>\
        \
    ')
};