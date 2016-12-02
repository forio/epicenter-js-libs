var defaultRunOptions = {
    account: 'jaimedp',
    project: 'glasses',
    model: 'gglasses.vmf',
};
var rm = new F.manager.RunManager({
    strategy: 'new-if-stepped',
    run: defaultRunOptions
});

rm.getRun().then(function (cr) {
    var rs = new F.service.Run(cr);
    rs.variables().query(['Price']).then(function (r) {
        $('#txtPriceDecision').val(r.Price);
    });
    window.rs = rs;
    console.log(cr);
});


$('#txtPriceDecision').on('change', function (evt) {
    window.rs.variables().save({ Price: Number(evt.target.value) });
});

$('#btnTrashRun').on('click', function () {
    var runid = $('#txtTrashRun').val();
    var isTrash = $('#chkTrashRun').is(':checked');

    var rs = new F.service.Run($.extend({}, defaultRunOptions, {
        filter: runid
    }));
    rs.save({ trashed: isTrash }).then(function () {
        console.log('saved', isTrash);
    });
});
