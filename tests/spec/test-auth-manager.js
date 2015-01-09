(function () {
    'use strict';

    describe('Auth Manager', function () {
        var server, token;
        before(function () {
            var userInfo = {
               'jti':'23b6c85b-abcc-443f-93aa-a2bd5e5d4e4b',
               'sub':'550a2b8b-80f7-4a72-80be-033f87c79cf0',
               'scope':[
                  'oauth.approvals',
                  'openid'
               ],
               'client_id':'login',
               'cid':'login',
               'grant_type':'password',
               'user_id':'550a2b8b-80f7-4a72-80be-033f87c79cf0',
               'user_name':'test_user_in_diff_groups/rippel/',
               'email':'none@none.com',
               'iat':1417567152,
               'exp':1417610352,
               'iss':'http://localhost:9763/uaa/oauth/token',
               'aud':[
                  'oauth',
                  'openid'
               ]
            };

            token = 'eyJhbGciOiJSUzI1NiJ9.' + btoa(JSON.stringify(userInfo)) + '.yYIKw_eWYXAoqPR9aKXs4_';
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/authentication/, function (xhr, id) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(
                    { 'refresh_token':'snip-refresh','access_token': token,'expires':43199 }
                    ));
            });
            server.respondWith(/(.*)\/member\/local/, function (xhr, id) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(
                    { 'refresh_token':'snip-refresh','access_token': token,'expires':43199 }
                    ));
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
            //token = null;
        });

        // TODO: Create some test, find a way for the fake server to auto respond synchronously inside a respond callback
    });
}());
