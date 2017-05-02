
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
        student: 'index.html',
        login: 'login.html'
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

    function checkLoginAndRedirect() {
        var session = authManager.getCurrentUserSessionInfo();
        var isFac = session.isFac || session.isTeamMember;
        if (!session || Object.keys(session).length === 0) {
            redirectToLogin();
            return false;
        }

        var currentPage = findCurrentPage();
        if (isFac && currentPage !== 'fac') { // Facilitators are always sent to the fac page.
            window.location.href = pages.fac;
            return false;
        } else if (!isFac && currentPage === 'fac') { // Standard end users trying to access the fac page are redirected.
            window.location.href = pages.student;
            return false;
        } else if (!isFac) {
            /*
                Optionally, you can redirect standard end users to the student page.
                However, if you have a multiple pages for standard end users, 
                you probably want to leave them where they are.
            */
            // window.location.href = pages.student;
            return false;
        }
        return true;
    }

    function logout() {
        authManager.logout().then(function (token) {
            console.log('Logged out, redirecting to login page');
            authManager.sessionManager.getStore().remove('epicenter-scenario');
            window.location.href = pages.login;
        });
    }

    checkLoginAndRedirect();

