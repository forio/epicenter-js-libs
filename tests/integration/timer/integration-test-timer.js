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
    var tm = new F.manager.TimerManager({
        scope: 'GROUP',
    });
    tm.start().then(()=> {

    });
});
