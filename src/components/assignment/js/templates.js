
// jshint multistr:true

module.exports = {
    userRow: _.template('<tr>\
        <td><input type="checkbox" class="select" data-id="<%= id%>"</td>\
        <td><%= world %></td>\
        <td><%= role %></td>\
        <td><%= lastName %></td>\
        <td><%= userName %></td>\
        <td></td>\
        <td class="actions"><button class="btn edit">Edit</button></td>\
        </tr>\
    ')
};