(function () {
    'use strict';
    describe('Auth Manager', function () {
        var server, token, userInfo, cookie, multipleGroupsResponse, teamMemberResponse;
        before(function () {
            teamMemberResponse = false;
            multipleGroupsResponse = false;
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
            var tmUserInfo = $.extend({ parent_account_id: null }, userInfo);
            var teamMemberToken = 'eyJhbGciOiJSUzI1NiJ9.' + btoa(JSON.stringify(tmUserInfo)) + '.yYIKw_eWYXAoqPR9aKXs4_';
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/authentication/, function (xhr, id) {
                var response = teamMemberResponse ? teamMemberToken : token;
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(
                    { 'refresh_token':'snip-refresh','access_token': response,'expires':43199 }
                    ));
            });
            var groupMembers = [
                {
                    'expirationDate': '2016-09-17T00:00:00.000Z',
                    'userId': '550a2b8b-80f7-4a72-80be-033f87c79cf0',
                    'role': 'standard',
                    'userName': 'ricardo001',
                    'account': 'accountName',
                    'lastName': 'Test 1',
                    'active': true
                }
            ];
            var singleGroup = [
              {
                  members: groupMembers,
                  'account': 'accountName',
                  'project': 'projectName',
                  'type': 'local',
                  'groupId': '111efcc9-726c-47b8-ba94-2895f110bd39',
                  'name': 'rv-test'
              }
            ];
            var multipleGroups = singleGroup.concat({
                members: groupMembers,
                account: 'accountName',
                project: 'projectName',
                type: 'local',
                groupId: '111efcc9-726c-47b8-ba94-2895f110bd32',
                name: 'rv-test2'
            });
            server.respondWith(/(.*)\/member\/local/, function (xhr, id) {
                var response = multipleGroupsResponse ? multipleGroups : singleGroup;
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response));
            });
            server.respondWith(/(.*)\/group\/local/, function (xhr, id) {
                var response = multipleGroupsResponse ? multipleGroups : singleGroup;
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(response));
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

            it ('it should set the session', function (done) {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    var session = am.getCurrentUserSessionInfo();
                    session.groupName.should.equal('rv-test');
                    session.groupId.should.equal('111efcc9-726c-47b8-ba94-2895f110bd39');
                    session.account.should.equal('accountName');
                    session.project.should.equal('projectName');
                    session.userId.should.equal('550a2b8b-80f7-4a72-80be-033f87c79cf0');
                    session.isFac.should.be.false;
                    am.sessionManager.removeSession();
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });

            it ('it should fail when the user has multiple groups', function (done) {
                multipleGroupsResponse = true;
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    multipleGroupsResponse = false;
                    done(new Error('Login should not work'));
                }).fail(function (data) {
                    multipleGroupsResponse = false;
                    data.userGroups.should.have.lengthOf(2);
                    done();
                });
            });

            it ('it should work when a group is specified', function (done) {
                multipleGroupsResponse = true;
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test', groupId: '111efcc9-726c-47b8-ba94-2895f110bd32' }).done(function (response) {
                    var session = am.getCurrentUserSessionInfo();
                    session.groupName.should.equal('rv-test2');
                    multipleGroupsResponse = false;
                    am.sessionManager.removeSession();
                    done();
                }).fail(function () {
                    multipleGroupsResponse = false;
                    done(new Error('Login should work'));
                });
            });

            it ('it should not work when a wrong group is used', function (done) {
                multipleGroupsResponse = true;
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test', groupId: 'wrong-id' }).done(function (response) {
                    multipleGroupsResponse = false;
                    done(new Error('Login should not work'));
                }).fail(function (data) {
                    multipleGroupsResponse = false;
                    data.userGroups.should.have.lengthOf(2);
                    done();
                });
            });

            it ('should log a team member and get all the groups in the project', function (done) {
                teamMemberResponse = true;
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('GET');
                    req.url.should.match(/https:\/\/api\.forio\.com\/group\/local\/?/);

                    var session = am.getCurrentUserSessionInfo();
                    session.groupName.should.equal('rv-test');
                    am.sessionManager.removeSession();
                    done();
                }).fail(function (data) {
                    done(new Error('Login should work'));
                });
                
            });

            it ('it should fail with the list of groups on a team member login with no group', function (done) {
                multipleGroupsResponse = true;
                teamMemberResponse = true;
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    multipleGroupsResponse = false;
                    teamMemberResponse = false;
                    done(new Error('Login should not work'));
                }).fail(function (data) {
                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('GET');
                    req.url.should.match(/https:\/\/api\.forio\.com\/group\/local\/?/);

                    multipleGroupsResponse = false;
                    teamMemberResponse = false;
                    data.userGroups.should.have.lengthOf(2);
                    done();
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
                        cookie: cookie,
                        domain: '.forio.com'
                    }
                });
                am.logout().done(function (response) {
                    var spyCall = cookie.set.getCall(0);
                    spyCall.args[0].should.match(/epicenterjs\.session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=\.forio\.com; path=\/app\/accountName\/projectName/);
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

        describe('#addGroups', function () {
            it ('it should have one group on login', function (done) {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    var session = am.getCurrentUserSessionInfo();
                    Object.keys(session.groups).should.have.lengthOf(1);
                    am.sessionManager.removeSession();
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });

            it ('it should accept an object', function (done) {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    am.addGroups({
                        project: 'test-project',
                        groupName: 'rv-test2',
                        groupId: 'groupId'
                    });
                    var session = am.getCurrentUserSessionInfo();
                    session.groups['test-project'].groupName.should.equal('rv-test2');
                    session.groups['test-project'].groupId.should.equal('groupId');
                    session.groups['test-project'].isFac.should.be.false;
                    
                    am.sessionManager.removeSession();
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });

            it ('it should accept an array', function (done) {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    am.addGroups([{
                        project: 'test-project',
                        groupName: 'rv-test2',
                        groupId: 'groupId'
                    }, {
                        project: 'test-project2',
                        groupName: 'rv-test2',
                        groupId: 'groupId',
                        isFac: true
                    }]);
                    var session = am.getCurrentUserSessionInfo();
                    session.groups['test-project2'].groupName.should.equal('rv-test2');
                    session.groups['test-project2'].groupId.should.equal('groupId');
                    session.groups['test-project2'].isFac.should.be.true;
                    
                    am.sessionManager.removeSession();
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });

            it ('it should override a project\'s group', function (done) {
                var am = new F.manager.AuthManager({
                    account: 'accountName',
                    project: 'projectName',
                });
                am.login({ userName: 'test', password: 'test' }).done(function (response) {
                    am.addGroups([{
                        project: 'projectName',
                        groupName: 'rv-test2',
                        groupId: 'groupId'
                    }]);
                    var session = am.getCurrentUserSessionInfo();
                    session.groups.projectName.groupName.should.equal('rv-test2');
                    session.groups.projectName.groupId.should.equal('groupId');
                    session.groups.projectName.isFac.should.be.false;
                    
                    am.sessionManager.removeSession();
                    done();
                }).fail(function () {
                    done(new Error('Login should not fail'));
                });
            });
        });
    });
}());
