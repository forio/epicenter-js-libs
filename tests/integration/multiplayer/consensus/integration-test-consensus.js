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
        var ws = new F.service.World($.extend(true, {}, defaults, {
            id: worldId
        }));
        function getConsensusService() {
            var bp = ws.consensus({ 
                consensusGroup: $('#txtConsensusGroup').val(),
                name: $('#txtConsensus').val(),
            });
            return bp;
        }

        $('#btnConsensusCreate').on('click', function () {
            var bp = getConsensusService();
            bp.create({
                executeActionsImmediately: true,
                defaultActions: {
                    P2: [{ name: 'step', arguments: [2] }],
                    P1: [{ name: 'step', arguments: [1] }],
                },
                ttlSeconds: 10
            });
        });
        $('#btnConsensusDelete').on('click', function () {
            var bp = getConsensusService();
            bp.delete();
        });
        $('#btnUpdateDefaults').on('click', function () {
            var bp = getConsensusService();
            bp.updateDefaults({ actions: [{ name: 'step', arguments: [Math.random()] }] });
        });

        $('#btnConsensusOperationSubmit').click(function () {
            var bp = getConsensusService();
            bp.submitActions([{ name: 'step', arguments: [] }]);
        });
        $('#btnConsensusOperationRevoke').click(function () {
            var bp = getConsensusService();
            bp.undoSubmit();
        });
        $('#btnForceClose').click(function () {
            var bp = getConsensusService();
            bp.forceClose();
        });

        $('#btnReset').click(function () {
            ws.newRunForWorld(worldId).then(function (res) {
                alert('reset complete');
            });
        });


        var cm = new F.manager.ChannelManager(defaults);
        var worldChannel = cm.getWorldChannel(worldId);
        worldChannel.subscribe('', function (data) {
            $('#generalWorldNotifications').append('<li><pre><code>' + JSON.stringify(data, null, 4) + '</code></pre></li>');
            console.log('World Channel notification', arguments);
        });

        // var world = new F.service.World({ id: worldId, account: 'team-naren', project: 'multiplayer-test', server: {
        //     host: 'test.forio.com'
        // } });
        // var consensusService = world.consensus({ consensusGroup: 'year', name: '2' });
        // consensusService.create({ 
        //     ttlSeconds: 10,
        //     defaultActions: {
        //         P1: [{ name: 'step', arguments: [] }],
        //         P2: [{ name: 'step', arguments: [] }],
        //     },
        // }).then((res)=> {
        //     setTimeout(function () {
        //         consensusService.forceClose();
        //     }, res.timeLeft * 1000);
        // });

        var runid = run.id;
        var rs = new F.service.Run($.extend(true, {}, defaults, {
            id: runid
        }));
        rs.load(runid, { include: ['Time', 'Step'] }).then(function (run) {
            console.log('Got current run variables', run.variables);
        });
    }, function (err) {
        console.error('Error getting current run', err);
        $('button').prop('disabled', false);
    });
}