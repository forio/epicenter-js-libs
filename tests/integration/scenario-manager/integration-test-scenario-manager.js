var defaultRunOptions = {
    account: $('#txtAccount').val(),
    project: $('#txtProject').val(),
    model: 'model.vmf',
};
var sm = new F.manager.ScenarioManager(defaultRunOptions);

var runRowtemplate = _.template($('#runTemplate').html());
sm.savedRuns.getRuns().then(function (runs) {
    $('.runsList').empty();
    // console.log(runs);
    if (!runs.length) {
        return;
    }

    runs.forEach(function (run, index) {
        if (!run.name) {
            run.name = 'Run ' + index;
        }
        run.nonRemovable = run.name.toLowerCase() === 'baseline';
        var templated = runRowtemplate({ run: run });
        $('.runsList').append(templated);
    });
});

sm.current.getRun().then(function (run) {
    $('#currentRunId').html(run.id);
    var rs = new F.service.Run(run);
    rs.variables().query(['Price[X5]', 'Time']).then(function (r) {
        var index = r['Price[X5]'].length - 1;
        $('#txtPriceDecision').val(r['Price[X5]'][index]);
        $('#time').html(r['Time'][index]);
    });
    window.cr = rs;
});

$('#txtPriceDecision').on('change', function (evt) {
    window.cr.variables().save({ 'Price[X5]': Number(evt.target.value) });
});
$('#btnSaveAndSimulate').on('click', function () {
    sm.savedRuns.add(window.cr).then(function () {
        window.cr.do({ stepTo: 'end' }).then(function () {
            console.log('simulated');
        });
    });
});

$('body').on('click', '.btn-remove', function (evt) {
    evt.preventDefault();
    var $target = $(evt.target).parents('tr');
    var runid = $target.data('runid').trim();

    sm.savedRuns.remove(runid).then(function () {
        window.location.reload();
    });
});