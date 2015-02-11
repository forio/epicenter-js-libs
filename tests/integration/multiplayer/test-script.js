'use strict';

$(function() {
    var server = {
        server: {
            host: 'api.forio.com'
        }
    };

    var cm = new F.manager.Channel(server);
    cm.on('connect', function () {
        $('#status').html('connected');
    });
    cm.on('disconnect', function () {
        $('#status').html('disconnected');
    });


    var am = new F.manager.AuthManager(server);
    $('#btnLogin').click(function (evt) {
        evt.preventDefault();
        am.login({
            userName: $('#txtUsername').val(),
            password: $('#txtPassword').val(),
            account: $('#txtAccount').val(),
            project: $('#txtProject').val()
        }).done(function () {
            window.alert('login successful');

            var gc = cm.getGroupChannel();
            var bindElementToTopic = function (elem, topic) {
                var $elem = $(elem);
                gc.subscribe(topic, function (payload) {
                    $elem.html($elem.val() + payload.data);
                });
                $elem.change(function () {
                    gc.publish(topic, $elem.val());
                });
            };
            bindElementToTopic('#txtGroupTextAll', '*');
            bindElementToTopic('#txtGroupTextSpecific', 'specificTopic');
        });
    });

    $('#logout').click(function (evt) {
        evt.preventDefault();
        am.logout().then(function () {
            window.alert('logged out');
        });
    });



});
