$('#btnCreate').click(function (evt) {
    evt.preventDefault();

    var scope = $('#scope').val();
    var timeLimit = +$('#txtTimeLimit').val() * 60 * 1000;

    var tm = new F.manager.TimerManager({
        scope: scope,
        time: timeLimit,
    });
    tm.create().then(function () {
        window.alert('Timer created');
    });
});


var tm = new F.manager.TimerManager({
    scope: 'GROUP',
});
tm.getChannel().then(function (channel) {
    channel.subscribe('', function (d) {
        console.log('Channel', d); 
    });
});



$('#btnDelete').click(function () {
    tm.cancel().then(function () {
        window.alert('cleared');
    });
});
$('#btnstart').click(function (evt) {
    tm.start();
});$('#btnpause').click(function (evt) {
    tm.pause();
});$('#btnresume').click(function (evt) {
    tm.resume();
});

$('#btnUpdateTime').click(function (evt) {
    tm.getTime().then(function (time) {
        console.log(time);
    }, function (e) {
        console.error('btnUpdateTime error', e);
    });
});