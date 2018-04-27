function getTm(evt, options) {
    evt.preventDefault();
    var $section = $(evt.target).closest('section');
    var scope = $section.data('scope');
    var timeLimit = +$section.find('.time-limit').val() * 60 * 1000;

    var tm = new F.service.Timer($.extend({
        scope: scope,
        time: timeLimit,
        tickInterval: 1000,
    }, options));
    return tm;
}


function tick(scope) {
    var tm = new F.service.Timer({
        scope: scope,
        tickInterval: 1000,
    });
    var groupTimerChannnel = tm.getChannel();
    groupTimerChannnel.subscribe('*', function (d) {
        console.log('global listener', d);
    });
    groupTimerChannnel.subscribe(tm.ACTIONS.TICK, function (d) {
        $(`[data-scope="${scope}"] .mins`).html(d.remaining.minutes);
        $(`[data-scope="${scope}"] .seconds`).html(d.remaining.seconds);
        console.log('tick listener', d.remaining);
    });
}

tick('user');
tick('group');

$('.btn-create').click(function (evt) {
    var tm = getTm(evt);
    tm.create().then(function () {
        window.alert('Timer created');
    });
});


$('.btn-delete').click(function (evt) {
    getTm(evt).cancel().then(function () {
        window.alert('cleared');
    });
});
$('.btnstart').click(function (evt) {
    getTm(evt).start();
});
$('.btnpause').click(function (evt) {
    getTm(evt).pause();
});
$('.btnresume').click(function (evt) {
    getTm(evt).resume();
});

$('.btnUpdateTime').click(function (evt) {
    getTm(evt).getTime().then(function (time) {
        console.log(time);
    }, function (e) {
        console.error('btnUpdateTime error', e);
    });
});