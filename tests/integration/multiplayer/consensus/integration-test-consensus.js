var defaults = {
    account: 'team-naren',
    project: 'multiplayer-test',
    model: $('#txtModel').val().trim(),
};

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
        // var wm = new F.manager.WorldManager({
        //     ...defaults,
        //     model: 'bikes-multiplayer.xlsx'
        // })
        // wm.getCurrentRun();

        var bp = getBPService();
        bp.create();
    });

    $('#btnConsensusOperationSubmit').click(()=> {
        var bp = getBPService();
        bp.submitWithOperations('step');
    });

    $('#btnReset').click(()=> {
        ws.newRunForWorld(worldId).then((res)=> {
            alert('reset complete');
        });
    });


    ws.load().then((res)=> {
        var runid = res.run;
        var rs = new F.service.Run({
            ...defaults,
            id: runid,
        });
        rs.load(runid, { include: ['Time', 'Step']}).then((run)=> {
            console.log(run.variables);
        });
    });
});
