'use strict';

function addToLog(parent, d) {
    const pretty = JSON.stringify(d, null, 2);
    $(parent).append('<li><code><pre>' + pretty + '</pre></code></li<');
}

$(function () {
    var cm = new F.manager.ChannelManager(getServiceOptions());
    cm.on('connect', function () {
        $('#status').html('connected');
    });
    cm.on('disconnect', function () {
        $('#status').html('disconnected');
    });


    $('#btnBindGroupChannel').click(function (evt) {
        evt.preventDefault();
        var gc = cm.getGroupChannel();
        alert('Bind Succcess');

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
        var worldManager = new F.manager.WorldManager(getServiceOptions());
        worldManager.getCurrentWorld().then(function (worldObject, worldService) {
            alert('Bind Succcess');

            console.log('wm', arguments);
            window.worldS = worldService;
            var worldChannel = cm.getWorldChannel(worldObject);
            worldChannel.subscribe('', function (data) {
                addToLog('#generalWorldNotifications', data);
            });

            var presenceChannel = cm.getPresenceChannel(worldObject);
            presenceChannel.on('presence', function (evt, notification) {
                addToLog('#presencechannelNotifications', notification);
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


    function getDS() {
        var collName = $('#txtCollName').val().trim();
        var scope = $('#lstDataScope').val();

        const ds = new F.service.Data($.extend(true, {}, getServiceOptions(), {
            scope: scope,
            root: collName,
        }));
        return ds;
    }

    $('#btnCreateCollection').click(function () {
        var ds = getDS();
        ds.save({
            thisExists: true,
            val: 'Something'
        }).then(()=> {
            alert('collection created');
        });
        var datachannel = ds.getChannel();
        datachannel.subscribe('', function (data, meta) {
            addToLog('#data-api-output', {
                data: data,
                meta: meta
            });
        });
    });

    $('#btnAddToCollection').click(function () {
        var ds = getDS();
        var key = 'some-key-' + Math.round(Math.random() * 100);
        var params = {};
        params[key] = {
            test: true,
            val: $('#txtTextForData').val() || 'test'
        };
        ds.save(params);
    });
    window.cm = cm;
});