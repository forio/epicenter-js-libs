'use strict';

$(function () {
    var server = {
        server: {
            host: 'api.forio.com'
        }
    };

    var cm = new F.manager.ChannelManager(server);
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

        var presenceChannel = cm.getPresenceChannel(worldObject);
        presenceChannel.on('presence', function (evt, notification) {
            console.log('online', notification);
        });

        window.wc = worldChannel;
    });
    worldManager.getCurrentRun().then(function (runObject, runservice) {
       console.log('current run', arguments);
       window.rs = runservice;
    });

    window.datachannel = null;
    window.ds = null;
    $('#btnCreateCollection').click(function () {
        var collName = $('#txtCollName').val().trim();
        window.ds = new F.service.Data({
            root: collName,
            account: 'team-naren',
            project: 'multiplayer-test'
        });
        window.ds.save({ thisExists: true , val: 'Chinese (汉语 / 漢語; Hànyǔ or 中文; Zhōngwén'});
        window.datachannel = cm.getDataChannel(collName);
        window.datachannel.subscribe('', function (data, meta) {
            console.log('data changed', data, meta);
        });
    });

    $('#btnAddToCollection').click(function () {
        var key = 'some-key-' + Math.round(Math.random() * 100);
        var params = {};
        params[key] = { test: true, val: $('#txtTextForData').val() || 'test' };
        window.ds.save(params);
    });
    window.cm = cm;
});
