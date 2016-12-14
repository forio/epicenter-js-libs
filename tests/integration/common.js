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

$('#logout').click(function (evt) {
    evt.preventDefault();
    am.logout().then(function () {
        window.alert('logged out');
    });
});
