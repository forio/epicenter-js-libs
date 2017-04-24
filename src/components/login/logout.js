$('.header .logout').on('click', function (evt) {
    var authManager = new F.manager.AuthManager();
    authManager.logout().then(function (token) {
        console.log('Logged out, redirecting to index.html');
        authManager.sessionManager.getStore().remove('epicenter-scenario');
        window.location.href = 'index.html';
    });
});