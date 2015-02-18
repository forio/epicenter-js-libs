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

    var worldManager = new F.manager.WorldManager({
        run: $.extend({}, {
            account: 'team-naren',
            model: 'model.eqn',
            project: 'multiplayer-test'
        }, server)
    });
    worldManager.getCurrentWorld().then(function (worldObject, worldService) {
        console.log('wm', arguments);
        window.worldS = worldService;
        var worldChannel = cm.getWorldChannel(worldObject);
        worldChannel.subscribe('', function () {
           console.log('stuff', arguments);
        });
        window.wc = worldChannel;
    });
    worldManager.getCurrentRun().then(function (runObject, runservice) {
       console.log('current run', arguments);
       window.rs = runservice;
    });

    window.cm = cm;


});
