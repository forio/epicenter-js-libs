$('#btnLogin').click(function (evt) {
    evt.preventDefault();

    var params = {
        userName: $('#txtUsername').val(),
        password: $('#txtPassword').val(),
        account: $('#txtAccount').val(),
        project: $('#txtProject').val()
    };

    var amParams = {};
    if ($('#txtServer').val()) {
        amParams.server = {
            host: $('#txtServer').val(),
            protocol: 'https',
        };
    }
    window.am = new F.manager.AuthManager(amParams);

    am.login(params).then(function () {
        window.alert('login successful');
    });
});

$('#logout').click(function (evt) {
    evt.preventDefault();
    am.logout().then(function () {
        window.alert('logged out');
    });
});
