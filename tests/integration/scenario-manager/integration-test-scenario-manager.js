

var defaultRunOptions = {
    account: 'team-naren',
    project: 'authenticated-glasses',
    model: 'gglasses.vmf',
};

var sm = new F.manager.ScenarioManager({ run: defaultRunOptions });
//Current Run tests
var decisionVariable = 'Price';
sm.current.getRun([decisionVariable, 'Time']).then(function (run) {
    $('#currentRunId').html(run.id);
    var index = run.variables[decisionVariable].length - 1;
    $('#txtPriceDecision').val(run.variables[decisionVariable][index]);
    $('#time').html(run.variables['Time'][index]);
});

$('#txtPriceDecision').on('change', function (evt) {
    var params = {};
    params[decisionVariable] = Number(evt.target.value);
    sm.current.run.variables().save(params);
});
$('#btnSaveAndSimulate').on('click', function () {
    sm.current.saveAndAdvance().then(function () {
        window.alert('simulated');
    });
});


window.sm = sm;
//Saved run tests
var runRowtemplate = _.template($('#runTemplate').html());
sm.savedRuns.getRuns([decisionVariable, 'Time']).then(function (runs) {
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
$('body').on('click', '.btn-remove', function (evt) {
    evt.preventDefault();
    var $target = $(evt.target).parents('tr');
    var runid = $target.data('runid').trim();

    sm.savedRuns.remove(runid).then(function () {
        window.location.reload();
    });
});