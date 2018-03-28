var defaults = {
    account: 'team-naren',
    project: 'multiplayer-test',
    model: $('#txtModel').val().trim(),
};

var am = new F.manager.AuthManager();
if (!am.isLoggedIn()) {
    console.warn('Not logged in');
} else {
    var wm = new F.manager.WorldManager(defaults);
    $('button').prop('disabled', true);
    wm.getCurrentWorld().then((worldRes)=> {
        $('button').prop('disabled', false);

        var worldId = worldRes.id;
        var  ws = new F.service.World({
            ...defaults,
            id: worldId
        });
        function getBPService() {
            var bp = ws.consensus($('#txtConsensus').val()).breakpoints($('#txtBreakpoint').val());
            return bp;
        }

        $('#btnConsensusCreate').on('click', ()=> {
            var bp = getBPService();
            bp.create();
        });
        $('#btnConsensusDelete').on('click', ()=> {
            var bp = getBPService();
            bp.delete();
        });

        $('#btnConsensusOperationSubmit').click(()=> {
            var bp = getBPService();
            bp.submitWithOperations('step');
        });
        $('#btnConsensusOperationRevoke').click(()=> {
            var bp = getBPService();
            bp.undoSubmit();
        });

        $('#btnReset').click(()=> {
            ws.newRunForWorld(worldId).then((res)=> {
                alert('reset complete');
            });
        });


        ws.load().then((res)=> {
            var cm = new F.manager.ChannelManager(defaults);
            var worldChannel = cm.getWorldChannel(res);
            worldChannel.subscribe('', function (data) {
                $('#generalWorldNotifications').append('<li><pre><code>' + JSON.stringify(data, null, 4) + '</code></pre></li>');
                console.log('World Channel notification', arguments);
            });

            var runid = res.run;
            var rs = new F.service.Run({
                ...defaults,
                id: runid,
            });
            rs.load(runid, { include: ['Time', 'Step']}).then((run)=> {
                console.log('Got current run variables', run.variables);
            });
        });
    });
}


