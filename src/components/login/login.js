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
                .attr('value', this.groupKey)
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

        var mfaCode = $('#mfaCode').val();

        $('button', form).attr('disabled', 'disabled').addClass('disabled');
        $('#login-message').text('').hide();
        $('.mfa input').on('change', function () {
            $('.mfa').removeClass('has-error');
        });

        if (!account) {
            console.log('No account was specified and it cannot be extracted from the URL. You may not be able to login.');
        }

        if (!project) {
            console.log('No project was specified and it cannot be extracted from the URL.');
        }

        var auth = new F.v3.manager.AuthManager({
            account: account,
            project: project
        });
        const loginParams = {
            handle: userName,
            password: password,
        };
        if (groupId) loginParams.groupKey = groupId;
        if (mfaCode) loginParams.mfaCode = mfaCode;
        auth.login(loginParams).then(function () {
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
        }, function (error) {
            if (error.type === 'MULTIPLE_GROUPS') {
                selectGroup(userName, password, account, project, error.context.possibleGroups, action);
            } else if (error.type === 'NO_GROUPS') {
                showError('User is not a member of a simulation group.');
                $('.mfa').addClass('hidden');
                $('#mfaCode').val('');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false);
            } else if (error.type === 'AUTHORIZATION_FAILURE') {
                showError('Could not login, please check username/ password and try again.');
                $('.mfa').addClass('hidden');
                $('#mfaCode').val('');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false);
            } else if (error.type === 'PASSWORD_EXPIRATION') {
                showError('Your password has expired.  Please contact your administrator and request a password reset.');
                $('.mfa').addClass('hidden');
                $('#mfaCode').val('');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false);
            } else if (error.type === 'MULTI_FACTOR_AUTHENTICATION_FAILURE') {
                showError('Could not login, please check username, password and/or authentication code and try again.');
                $('.mfa').addClass('hidden');
                $('#mfaCode').val('');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false);
            } else if (error.type === 'MULTI_FACTOR_AUTHENTICATION_REQUIRED') {
                showError('Could not login, this project requires a user set up with multi factor authentication.');
                $('.mfa').addClass('hidden');
                $('#mfaCode').val('');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false);
            } else if (error.type === 'MULTI_FACTOR_AUTHENTICATION_MISSING') {
                if ($('.mfa').hasClass('hidden')) {
                    $('.mfa').removeClass('hidden');
                }
                $('#username').prop('disabled', true);
                $('#password').prop('disabled', true);
            } else {
                showError('Unknown error occured. Please try again. (' + error.type + ')');
                $('.mfa').addClass('hidden');
                $('#mfaCode').val('');
                $('#username').prop('disabled', false);
                $('#password').prop('disabled', false);
            }

            $('button', form).attr('disabled', null).removeClass('disabled');
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
