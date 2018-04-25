function getTm(evt, options) {
    evt.preventDefault();
    var $section = $(evt.target).closest('section');
    var scope = $section.data('scope');
    var timeLimit = +$section.find('.time-limit').val() * 60 * 1000;

    var tm = new F.manager.TimerManager($.extend({
        scope: scope,
        time: timeLimit,
        tickInterval: 1000,
    }, options));
    return tm;
}


var tm = new F.manager.TimerManager({
    scope: 'group',
    tickInterval: 1000,
});
var channel = tm.getChannel();

channel.subscribe('', function (d) {
    console.log('global listener', d);
});
channel.subscribe('tick', function (d) {
    $('#mins').html(d.tick.remaining.minutes);
    $('#seconds').html(d.tick.remaining.seconds);
    console.log('tick listener', d.tick.remaining);
});
// channel.subscribe('tick', function (d) {
//     console.log('tick', d);
// });
// channel.subscribe('actions', function (d) {
//     console.log('actions', d);
// });
// channel.subscribe('complete', function (d) {
//     console.log('actions', d);
// });


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