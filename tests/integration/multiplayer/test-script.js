'use strict';

$(function() {
    var server = {
        server: {
            host: 'api.forio.com'
        }
    };

    var cm = new F.manager.Channel(server);
    cm.on('connect', function () {
        $('#status').html('connected');
    });
    cm.on('disconnect', function () {
        $('#status').html('disconnected');
    });


    var am = new F.manager.AuthManager(server);
    $('#btnLogin').click(function (evt) {
        evt.preventDefault();
        am.login({
            userName: $('#txtUsername').val(),
            password: $('#txtPassword').val(),
            account: $('#txtAccount').val(),
            project: $('#txtProject').val()
        }).done(function () {
            window.alert('login successful');
        });
    });

    $('#btnBindGroupChannel').click(function (evt) {
        evt.preventDefault();
        var gc = cm.getGroupChannel();
        var bindElementToTopic = function (elem, topic) {
            var $elem = $(elem);
            gc.subscribe(topic, function (payload) {
                $elem.val($elem.val() + payload.data);
            });
            $elem.change(function () {
                gc.publish(topic, $elem.val());
            });
        };
        bindElementToTopic('#txtGroupTextAll', '*');
        bindElementToTopic('#txtGroupTextSpecific', 'specificTopic');
    });

    $('#logout').click(function (evt) {
        evt.preventDefault();
        am.logout().then(function () {
            window.alert('logged out');
        });
    });

    var rm = new F.manager.RunManager({
        strategy: 'multiplayer',
        run: $.extend({}, {
            account: 'team-naren',
            project: 'multiplayer-test'
        }, server)
    });
    rm.getRun().then(function (run) {
        var rs = new F.service.Run(
            $.extend({}, {
                account: 'team-naren',
                project: 'multiplayer-test'
            }, server));
        rs.load(run.id).then(function () {
            window.rs = rs;
        });
        console.log('run', arguments);
    }).fail(function () { console.log('Run creation failed', arguments); });

    var worldChannel = cm.getWorldChannel('54de2bc1fac2a4b948000005');
    worldChannel.subscribe('', function (data) {
       console.log('World channel', data);
    });
    window.wc = worldChannel;
    window.rm = rm;
});
