var server = $('#txtServer').val();
var defaults = {
    account: 'team-naren',
    project: 'multiplayer-test',
    model: $('#txtModel').val().trim(),
    server: {
        host: server,
        // protocol: server ? 'http' : 'https'
    }
};

var am = new F.manager.AuthManager();
if (!am.isLoggedIn()) {
    console.warn('Not logged in');
} else {
    var wm = new F.manager.WorldManager(defaults);
    $('button').prop('disabled', true);
    wm.getCurrentRun().then(function (run) {
        var worldRes = run.world;
        $('button').prop('disabled', false);

        var worldId = worldRes.id;
        var  ws = new F.service.World({
            ...defaults,
            id: worldId
        });
        function getConsensusService() {
            var bp = ws.consensus({ 
                consensusGroup:  $('#txtConsensus').val(),
                name: $('#txtBreakpoint').val(),
            });
            return bp;
        }

        $('#btnConsensusCreate').on('click', ()=> {
            var bp = getConsensusService();
            bp.create({
                defaultActions: {
                    P1: [{ name: 'step', arguments: [] }]
                },
                ttlSeconds: 10
            });
        });
        $('#btnConsensusDelete').on('click', ()=> {
            var bp = getConsensusService();
            bp.delete();
        });

        $('#btnConsensusOperationSubmit').click(()=> {
            var bp = getConsensusService();
            bp.submitActions([{ name: 'step', arguments: [] }]);
        });
        $('#btnConsensusOperationRevoke').click(()=> {
            var bp = getConsensusService();
            bp.undoSubmit();
        });
        $('#btnForceClose').click(()=> {
            var bp = getConsensusService();
            bp.forceClose();
        });

        $('#btnReset').click(()=> {
            ws.newRunForWorld(worldId).then((res)=> {
                alert('reset complete');
            });
        });


        var cm = new F.manager.ChannelManager(defaults);
        var worldChannel = cm.getWorldChannel(worldId);
        worldChannel.subscribe('', function (data) {
            $('#generalWorldNotifications').append('<li><pre><code>' + JSON.stringify(data, null, 4) + '</code></pre></li>');
            console.log('World Channel notification', arguments);
        });

        var runid = run.id;
        var rs = new F.service.Run({
            ...defaults,
            id: runid,
        });
        rs.load(runid, { include: ['Time', 'Step']}).then((run)=> {
            console.log('Got current run variables', run.variables);
        });
    });
}


