var am = new F.manager.AuthManager();
$('#btnLogin').click(function (evt) {
    evt.preventDefault();
    am.login({
        userName: $('#txtUsername').val(),
        password: $('#txtPassword').val(),
        account: $('#txtAccount').val(),
        project: $('#txtProject').val()
    }).then(function () {
        window.alert('login successful');
    });
});

var defaultRunOptions = {
    account: $('#txtAccount').val(),
    project: $('#txtProject').val(),
    model: 'model.vmf',
};
var sm = new F.manager.ScenarioManager(defaultRunOptions);

var runRowtemplate = _.template($('#runTemplate').html());
sm.getSavedRuns().then(function (runs) {
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