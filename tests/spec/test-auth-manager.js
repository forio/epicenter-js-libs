(function () {
    'use strict';
    describe('Auth Manager', function () {
        var server, token, userInfo, cookie;
        before(function () {
            var cookieStr = '';
            cookie = {
                get: function () {
                    return cookieStr;
                },
                set: function (newCookie) {
                    cookieStr += newCookie + ';';
                },
                clear: function () {
                    cookieStr = '';
                }
            };
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
                    //jshint camelcase: false
                    //jscs:disable
                    response.auth.access_token.should.equal(token);
                    response.user.should.eql(userInfo);
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });
        });

        describe('Logout', function () {
            it ('It should remove the epicenter cookie', function (done) {
                sinon.spy(cookie, 'set');
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                    isLocal: false,
                    store: {
                        cookie: cookie
                    }
                });
                am.logout().done(function (response) {
                    var spyCall = cookie.set.getCall(0);
                    spyCall.args[0].should.match(/epicenterjs\.session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=\.forio\.com; path=\/app\/accountName\/projectName/);
                    console.log(cookie.get());
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });
        });

        describe('#setting cookies', function () {
            it ('creates cookie with the correct path name when passing in account info in consructor', function () {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                    isLocal: false
                });
                //am.login();
                var store = am.sessionManager.getStore();
                store.serviceOptions.root.should.equal('/app/accountName/projectName');
            });
            it ('creates cookie with the root path in local mode', function () {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                    isLocal: true
                });
                var store = am.sessionManager.getStore();
                store.serviceOptions.root.should.equal('/');
            });
            it ('creates cookie with the correct path name when passing in account info in login', function (done) {
                var am = new F.manager.AuthManager({
                    isLocal: false,
                    store: {
                        cookie: cookie
                    }
                });
                am.login({
                    account: 'accountName',
                    project: 'projectName',
                    userName: 'test',
                    password: 'test',
                }).done(function (response) {
                    var pathIdx = cookie.get().indexOf('path=/app/accountName/projectName');
                    pathIdx.should.not.equal(-1);
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
                // var store = am.sessionManager.getStore();
                // store.serviceOptions.root.should.equal('/app/accountName/projectName');
            });
        });
    });
}());
