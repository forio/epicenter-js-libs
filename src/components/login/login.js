(function () {
    'use strict';

    var groupSelectionTemplate;

    var showError = function (msg, status) {
        $('#login-message').text(msg).show();
    };

    var selectGroup = function (userName, password, account, project, groups) {
        var dlg = (dlg = $('.group-selection-dialog')).length ? dlg : $(groupSelectionTemplate).appendTo($('body'));
        var select = $('#log-to-group', dlg);
        select.find('[value]').remove();
        $.each(groups, function () {
            $('<option>')
                .attr('value', this.groupId)
                .text(this.name)
                .appendTo(select);
        });

        select.on('change', function (e) {
            $('#forio-login-groupId').val($(e.target).val());
        });

        var closeDlg = function () {
            $('.group-selection-dialog').hide();
        };

        $('.close', dlg).off('click', null).on('click', closeDlg);

        $('.group-selection-dialog').show();
    };

    $('#login, form:has(#btn-login)').on('submit', function (e) {
        e.preventDefault();
        var form = $(e.target);
        var action = form.attr('action') || 'index.html';
        var userName = $('#forio-login-username').val();
        var password = $('#forio-login-password').val();
        var account = $('#forio-login-account').val();
        var project = $('#forio-login-project').val();
        var groupId = ($('#forio-login-groupId').length ? $('#forio-login-groupId') : $('<input type="hidden" id="forio-login-groupId">').appendTo(form)).val();

        $('button', form).prop('disabled', 'disabled').addClass('disabled');
        $('#login-message').text('').hide();

        var auth = new F.manager.AuthManager();
        auth.login({
            userName: userName,
            password: password,
            account: account,
            project: project,
            groupId: groupId
        })
        .fail(function (error) {
            if (error.status === 401) {
                showError('Invalid user name or password.', error.status);
            } else if (error.status === 403) {
                selectGroup(userName, password, account, project, error.userGroups);
            } else {
                showError('Unknown error occured. Please try again. (' + error.status + ')', error.status);
            }

            $('button', form).removeProp('disabled').removeClass('disabled');
        })
        .then(function () {
            window.location = action;
        })
        .done(function () {
            $('.group-selection-dialog').hide();
        });
    });

    /* jshint multistr:true */
    groupSelectionTemplate = window.groupSelectionTemplate = '<form>\
        <div class="group-selection-dialog" style="display: none"> \
            <div class="panel panel-default form-inline"> \
                <div class="panel-heading"><span class="panel-title">Please select a group</span><span class="close pull-right">x</span></div> \
                <div class="panel-body"> \
                    <label for="log-to-group">Group:</label> \
                    <select name="log-to-group" id="log-to-group" class="form-control"> \
                        <option default>Please select a group</option> \
                    </select> \
                </div> \
                <div class="panel-footer clearfix"> \
                    <button id="btn-login" class="pull-right btn btn-primary">Select Group</button> \
                </div> \
            </div> \
        </div> \
    </form> \
    ';
})();