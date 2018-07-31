var defaults = {
    account: 'team-naren',
    project: 'multiplayer-test',
    model: $('#txtModel').val().trim(),
};

$('#btnGetCurrent').on('click', ()=> {
    var cm = new F.manager.ConsensusManager();
    cm.getCurrent().then((c)=> {
        console.log(c);
    });
});
