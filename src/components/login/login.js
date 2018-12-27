$(function () {
    'use strict';

    var groupSelectionTemplate;

    var showError = function (msg) {
        $('#login-message').text(msg).show();
    };

    var getAccountProjectFromUrl = function () {
        var url = window.location.href;
        var parts = url.match(/https?:\/\/([^/]*)\/app\/([^/]*)\/([^/]*)/) || [];
        return {
            account: parts[2],
            project: parts[3], //eslint-disable-line
        };
    };

    var selectGroup = function (userName, password, account, project, groups, action) {
        var dlg = (dlg = $('.group-selection-dialog')).length ? dlg : $(groupSelectionTemplate).appendTo($('body')); //eslint-disable-line
        dlg.attr('action', action);
        var select = $('#login-group', dlg);
        select.find('[value!=""]').remove();
        $.each(groups, function () {
            $('<option>')
                .attr('value', this.groupId)
                .text(this.name)
                .appendTo(select);
        });

        select.on('change', function (e) {
            var val = $(e.target).val();
            $('#groupId').val(val);

            if (val) {
                $('#btn-login', dlg).removeClass('disabled').removeAttr('disabled');
            } else {
                $('#btn-login', dlg).addClass('disabled').attr('disabled', 'disabled');
            }
        });

        var closeDlg = function () {
            $('.group-selection-dialog').hide();
        };

        $('.close', dlg).off('click', null).on('click', closeDlg);

        $('.group-selection-dialog').show();
    };

    $('body').on('submit', '#login, form:has(#btn-login)', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var form = $(e.target);
        var fromUrl = getAccountProjectFromUrl();
        var action = form.prop('action') || 'index.html';
        var userName = $('#username').val();
        var password = $('#password').val();

        var account = $('#account:not([data-local])').val() || fromUrl.account || $('#account').val();
        var project = $('#project:not([data-local])').val() || fromUrl.project || $('#project').val();
        var groupId = ($('#groupId').length ? $('#groupId') : $('<input type="hidden" id="groupId">').appendTo(form)).val();

        $('button', form).attr('disabled', 'disabled').addClass('disabled');
        $('#login-message').text('').hide();

        if (!account) {
            console.log('No account was specified and it cannot be extracted from the URL. You may not be able to login.');
        }

        if (!project) {
            console.log('No project was specified and it cannot be extracted from the URL.');
        }

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
                    showError('Invalid user name or password.');
                } else if (error.status === 403) {
                    if (error.type === 'MULTIPLE_GROUPS') {
                        selectGroup(userName, password, account, project, error.userGroups, action);
                    } else if (error.type === 'NO_GROUPS') {
                        showError('The user has no groups associated in this account');
                    } else {
                        showError(error.statusText || error.message || ('Unknown Error' + error.status));
                    }
                } else {
                    showError('Unknown error occured. Please try again. (' + error.status + ')');
                }

                $('button', form).attr('disabled', null).removeClass('disabled');
            })
            .then(function () {
                var session = auth.getCurrentUserSessionInfo();
                if ($('#log-login').length) {
                    var url = $('#log-login').val();
                    $.get(url + '?userName=' + session.userName + '&groupName=' + session.groupName);
                }
                var newPage = action;
                var facPage = $('#fac-redirect-page').val();
                if ((session.isFac || session.isTeamMember) && facPage) {
                    newPage = facPage;
                }
                window.location = newPage;
                $('.group-selection-dialog').hide();
            });
    });

    groupSelectionTemplate = window.groupSelectionTemplate = '<form>\
        <div class="group-selection-dialog" style="display: none"> \
            <div class="panel panel-default form-inline"> \
                <div class="panel-heading"><span class="panel-title">Please select a group</span><span class="close pull-right"></span></div> \
                <div class="panel-body"> \
                    <label for="login-group">Group:</label> \
                    <select name="login-group" id="login-group" class="form-control"> \
                        <option default value="">Please select a group</option> \
                    </select> \
                </div> \
                <div class="panel-footer clearfix"> \
                    <button id="btn-login" disabled class="pull-right btn btn-primary disabled">Select Group</button> \
                </div> \
            </div> \
        </div> \
    </form> \
    ';
});
