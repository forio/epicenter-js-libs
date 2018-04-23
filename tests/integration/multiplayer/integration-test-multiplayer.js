'use strict';

$(function () {
    var server = {};

    var cm = new F.manager.ChannelManager(server);
    cm.on('connect', function () {
        $('#status').html('connected');
    });
    cm.on('disconnect', function () {
        $('#status').html('disconnected');
    });


    $('#btnBindGroupChannel').click(function (evt) {
        evt.preventDefault();
        var gc = cm.getGroupChannel();

        var topic = 'specificTopic';
        $('#txtGroupTextSpecific').on('change', function (evt) {
            gc.publish(topic, $(evt.target).val());
        });

        gc.subscribe(topic, function (payload) {
            $('#txtGroupTextSpecific-op').html(payload.data);
        });
        gc.subscribe('*', function (payload) {
            $('#txtGroupTextAll-op').html(payload.data);
        });
    });

    $('#btnBindToWorld').on('click', function () {
        var worldManager = new F.manager.WorldManager({
            run: $.extend({}, {
                account: $('#txtAccount').val(),
                model: $('#txtModel').val(),
                project: $('#txtProject').val(),
            }, server)
        });
        worldManager.getCurrentWorld().then(function (worldObject, worldService) {
            console.log('wm', arguments);
            window.worldS = worldService;
            var worldChannel = cm.getWorldChannel(worldObject);
            worldChannel.subscribe('', function (data) {
                $('#generalWorldNotifications').append('<li><code>' + JSON.stringify(data) + '</code></li<');
                console.log('stuff', arguments);
            });

            var presenceChannel = cm.getPresenceChannel(worldObject);
            presenceChannel.on('presence', function (evt, notification) {
                $('#presencechannelNotifications').append('<li><code>' + JSON.stringify(notification) + '</code></li<');
                console.log('online', notification);
            });

            window.wc = worldChannel;
        });
        worldManager.getCurrentRun().then(function (runObject, runservice) {
            console.log('current run', arguments);
            window.rs = runservice;
            // $('#currentRunId').html(runservice.getCurrentConfig().id);
        });
    });
    

    window.datachannel = null;
    window.ds = null;
    $('#btnCreateCollection').click(function () {
        var collName = $('#txtCollName').val().trim();
        window.ds = new F.service.Data({
            root: collName,
            account: 'team-naren',
            project: 'multiplayer-test',
            server: server.server,
        });
        window.ds.save({ thisExists: true, val: 'Chinese' });
        window.datachannel = cm.getDataChannel(collName);
        window.datachannel.subscribe('', function (data, meta) {
            $('#data-api-output').append('<li> Data: <code>' + JSON.stringify(data) + '</code> <br/> meta: <code>' + JSON.stringify(meta) + '</code></li>');
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
