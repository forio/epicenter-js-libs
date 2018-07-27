
$('#btnGetCurrent').on('click', ()=> {
    var cm = new F.manager.ConsensusManager();
    cm.getCurrent().then((c)=> {
        console.log(c);
    });
});
