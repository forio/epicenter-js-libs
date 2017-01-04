'use strict';

$(function () {
    // var server = {
    //     server: {
    //         host: 'epimon2.foriodev.com',
    //         protocol: 'http'
    //     }
    // };

    var am = new F.manager.AuthManager();
    $('#btnLogin').click(function (evt) {
        evt.preventDefault();
        am.login({
            userName: $('#txtUsername').val(),
            password: $('#txtPassword').val(),
            account: $('#txtAccount').val(),
            project: $('#txtProject').val()
        }).then(function () {
            window.alert('login successful');
        });
    });

    $('#logout').click(function (evt) {
        evt.preventDefault();
        am.logout().then(function () {
            window.alert('logged out');
        });
    });

    var pr = new F.service.Presence();
    $('#btnMarkOnline').click(function (evt) {
        evt.preventDefault();
        pr.markOnline().then(function (msg) {
            window.alert('marked online!');
        }).fail(function () {
            window.alert('unsuccessful! Check authorization');
        });
    });
    
    $('#btnMarkOnlineWithId').click(function (evt) {
        evt.preventDefault();
        pr.markOnline('3bf6710c-11ae-4935-8d2f-b8143976df21').then(function (msg) {
            window.alert('marked online!');
        }).fail(function () {
            window.alert('unsuccessful! Check authorization');
        }); 
    });

    $('#btnMarkOffline').click(function (evt) {
        evt.preventDefault();
        pr.markOffline().then(function (msg) {
            window.alert('marked offline!');
        }).fail(function () {
            window.alert('unsuccessful! Check authorization');
        });
    });

    $('#btnMarkOfflineWithId').click(function (evt) {
        evt.preventDefault();
        pr.markOffline('3bf6710c-11ae-4935-8d2f-b8143976df21').then(function (msg) {
            window.alert('marked offline!');
        }).fail(function () {
            window.alert('unsuccessful! Check authorization');
        });
    });

    $('#btnGetStatus').click(function (evt) { 
        evt.preventDefault();
        pr.getStatus().then(function (status) {
            $('#status').html(
                status.map(function (u) {
                    return u.userId + ' (' + u.ttlSeconds + ') ' + u.message;
                }).join(', '));
        });
    });

});