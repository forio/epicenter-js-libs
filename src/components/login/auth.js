$(function () {
    'use strict';

    var authManager = new F.manager.AuthManager();
    /*
        If you change the file names for the facilitator, student, or login pages,
        make sure to update the file names here.

        If you change the file name for the login page, 
        make the corresponding change in logout.js.
    */
    var pages = {
        fac: 'facilitator.html',
        student: 'simulation.html',
        login: 'index.html'
    };

    function redirectToLogin(error) {
        console.log('Session not found, redirecting to ' + pages.login);
        window.location.href = pages.login;
    }

    function endsWith(str, ending) {
        return str.indexOf(ending, str.length - ending.length) !== -1;
    }

    function findCurrentPage() {
        var pathname = window.location.pathname;
        pathname = pathname === '/' ? 'index.html' : pathname;
        var pageKey;
        Object.keys(pages).forEach(function (key) {
            var page = pages[key];
            if (endsWith(pathname, page)) {
                pageKey = key;
            }
        });
        return pageKey;
    }

    window.auth = {
        checkLogin: function () {
            var session = authManager.getCurrentUserSessionInfo();
            var isFac = session.isFac || session.isTeamMember;
            if (!session || Object.keys(session).length === 0) {
                redirectToLogin();
                return false;
            }

            var currentPage = findCurrentPage();
            if (isFac && currentPage === 'student') {
                window.location.href = pages.fac;
                return false;
            } else if (!isFac && currentPage !== 'student') {
                window.location.href = pages.student;
                return false;
            }
            return true;
        }
    };
})();


/* 
   The provided .html pages (simulation.html, facilitator.html) call auth.checkLogin(),
   redirecting to the login page if the user is not logged in.
   If you want to perform additional actions, you could use:

    if (auth.checkLogin()) {
        console.log('Session found!');
        // Execute your app's code
    }
    // else it will be automatically redirected to pages.login (index.html) if no session is found

*/