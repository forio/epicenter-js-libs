var defaultRunOptions = {
    account: $('#txtAccount').val(),
    project: $('#txtProject').val(),
    model: 'model.vmf',
};
var rm = new F.manager.RunManager({
    strategy: 'reuse-last-unsaved',
    run: defaultRunOptions
});

rm.getRun().then(function (cr) {
    var rs = new F.service.Run(cr);
    rs.variables().query(['Price[X5]', 'Time']).then(function (r) {
        var index = r['Price[X5]'].length - 1;
        $('#txtPriceDecision').val(r['Price[X5]'][index]);
        $('#time').html(r['Time'][index]);
    });

    $('#txtTrashRun').val(cr.id);
    window.rs = rs;
    console.log(cr);
});


window.rm = rm;
$('#txtPriceDecision').on('change', function (evt) {
    window.rs.variables().save({ 'Price[X5]': Number(evt.target.value) });
});

$('#btnTrashRun').on('click', function () {
    var runid = $('#txtTrashRun').val();
    var isTrash = $('#chkTrashRun').is(':checked');

    var rs = new F.service.Run($.extend({}, defaultRunOptions, {
        filter: runid
    }));
    rs.save({ trashed: isTrash }).then(function () {
        console.log('saved. trashed:', isTrash);
    });
});

$('#btnSaveAndSimulate').on('click', function () {
    window.rs.save({
        saved: true,
    }).then(function () {
        window.rs.do({ stepTo: 'end' }).then(function () {
            console.log('simulated');
        });
    });
});
