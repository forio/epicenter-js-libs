function getServiceOptions() {
    var params = {
        account: $('#txtAccount').val(),
        project: $('#txtProject').val(),
        model: $('#txtModel').val(),
    };
    if ($('#txtServer').val()) {
        params.server = {
            host: $('#txtServer').val(),
            protocol: 'http',
        };
    }
    return params;
}

function getAM() {
    var am = new F.manager.AuthManager(getServiceOptions());
    return am;
}

$('#btnLogin').click(function (evt) {
    evt.preventDefault();

    var am = getAM();
    var params = {
        userName: $('#txtUsername').val(),
        password: $('#txtPassword').val(),
    };
    am.login(params).then(function () {
        window.alert('login successful');
    }, (e)=> {
        window.alert('login error');
        console.error(e);
    });
});

$('#logout').click(function (evt) {
    evt.preventDefault();
    var am = getAM();
    am.logout().then(function () {
        window.alert('logged out');
    });
});