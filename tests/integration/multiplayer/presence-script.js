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
    var channel = pr.getChannel();
    console.log(channel);
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

    function getStatus() {
        pr.getStatus().then(function (status) {
            $('#status').html(
                status.map(function (u) {
                    return u.userName + ' - ' + u.userId + ' (' + u.ttlSeconds + ') ' + u.message;
                }).join(', '));
        });
    }

    $('#btnGetStatus').click(function (evt) { 
        evt.preventDefault();
        getStatus();
    });

    var cm = new F.manager.ChannelManager();
    var cm2 = new F.manager.ChannelManager({
        userName: 'tom2',
    });
    var gc = cm.getGroupChannel();
    var gc2 = cm2.getGroupChannel();
    var token;
    var token2;

    $('#subscribeToChannel').click(function (evt) {
        evt.preventDefault();
        token = gc.subscribe('', function (payload) {
            var user = payload && payload.data.user && payload.data.user.lastName;
            var subType = payload && payload.data.subType;
            if (user && subType) {
                $('#publishGroupStatus').append(user + '(' + subType + '), ');        
            } else {
                $('#publishGroupStatus').append(payload.data.test + ', ');     
            }
        });
        getStatus();
    });

    $('#unsubscribeToChannel').click(function (evt) {
        evt.preventDefault();
        gc.unsubscribe(token);
        getStatus();
    });

    $('#publish').click(function (evt) {
        evt.preventDefault();
        gc.publish('', { test: 100 });
    });

    $('#subscribeToChannel2').click(function (evt) {
        evt.preventDefault();
        token2 = gc2.subscribe('', function (payload) {
            var user = payload && payload.data.user && payload.data.user.lastName;
            var subType = payload && payload.data.subType;
            if (user && subType) {
                $('#publishGroupStatus2').append(user + '(' + subType + '), ');     
            } else {
                $('#publishGroupStatus2').append(payload.data.test + ', ');     
            }
        });
        getStatus();
    });

    $('#unsubscribeToChannel2').click(function (evt) {
        evt.preventDefault();
        gc2.unsubscribe(token2);
        getStatus();
    });

    var pc = cm.getPresenceChannel();
    var pc2 = cm2.getPresenceChannel();
    var pcToken;
    var pcToken2;

    $('#subscribeToPresenceChannel').click(function (evt) {
        evt.preventDefault();
        pcToken = pc.subscribe('', function (payload) {
            var user = payload && payload.data.user && payload.data.user.lastName;
            var subType = payload && payload.data.subType;
            $('#publishStatus').append(user + '(' + subType + '), ');
        });
        getStatus();
    });

    $('#unsubscribeToPresenceChannel').click(function (evt) {
        evt.preventDefault();
        pc.unsubscribe(pcToken);
        getStatus();
    });

    $('#publishPresence').click(function (evt) {
        evt.preventDefault();
        pc.publish('', { test: 100 });
    });


    $('#subscribeToPresenceChannel2').click(function (evt) {
        evt.preventDefault();
        pcToken2 = pc2.subscribe('', function (payload) {
            var user = payload && payload.data.user && payload.data.user.lastName;
            var subType = payload && payload.data.subType;
            $('#publishStatus2').append(user + '(' + subType + '), ');
        });
        getStatus();
    });
    $('#unsubscribeToPresenceChannel2').click(function (evt) {
        evt.preventDefault();
        pc2.unsubscribe(pcToken2);
        getStatus();
    });

    cm.on('connect', function () {
        $('#channel-status').html('connected');
    });
    cm.on('disconnect', function () {
        $('#channel-status').html('disconnected');
    });
});