(function () {
    'use strict';
    describe('Auth Manager', function () {
        var server, token, userInfo;
        before(function () {
            userInfo = {
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
               'user_name':'ricardo001/accountName/',
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
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(
                    [
                      {
                          members: [
                              {
                                  'expirationDate': '2016-09-17T00:00:00.000Z',
                                  'userId': '550a2b8b-80f7-4a72-80be-033f87c79cf0',
                                  'role': 'standard',
                                  'userName': 'ricardo001',
                                  'account': 'accountName',
                                  'lastName': 'Test 1',
                                  'active': true
                              }
                          ],
                          'account': 'accountName',
                          'project': 'projectName',
                          'type': 'local',
                          'groupId': '111efcc9-726c-47b8-ba94-2895f110bd39',
                          'name': 'rv-test'
                      }
                    ]
                ));
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
            //token = null;
        });

        describe('Login', function () {
            it ('It should construct the right authenticaton request', function () {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' });
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/https:\/\/api\.forio\.com\/authentication\/?/);
            });

            it ('It should call members API on sucessful login', function (done) {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                  response.auth.access_token.should.equal(token);
                  response.user.should.eql(userInfo);
                  //response.groupSelection.should.equal(userInfo);
                  done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });
        });

        // TODO: Create some test, find a way for the fake server to auto respond synchronously inside a respond callback
        describe('#setting cookies', function () {
            it ('creates cookie with the correct path name when passing in account info in consructor', function () {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName'
                });
                am.isLocal = false;
                am.login();
                var store = am.sessionManager.getStore();
                store.serviceOptions.root.should.equal('/app/accountName/projectName');
            });
        });
        // describe('#setting cookies', function () {
        //     it ('creates cookie with the correct path name when passing in account info in login', function () {
        //         var am = new F.manager.AuthManager();
        //         am.isLocal = false;
        //         am.login({
        //             account: 'accountName',
        //             project: 'projectName'
        //         });
        //         var store = am.sessionManager.getStore();
        //         store.serviceOptions.root.should.equal('/app/accountName/projectName');
        //     });
        // });



    });
}());
