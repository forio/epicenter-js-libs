import MemberService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;
var account = 'forio';
var project = 'js-libs';
var baseURL = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('member/local');

describe('Member API Service', function () {
    var server;
    var cookieDummy = {
        get: function () {
            return '';
        },
        set: function (newCookie) {}
    };
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith('POST', /(.*)\/member/, function (xhr, id) {
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({ }));
        });

        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });

    function createMemberAdapter(options) {
        return new MemberService(options);
    }

    describe('#getGroupsForUser', function () {
        it('should call GET on the Member API with the userId parameter and the token', function () {
            createMemberAdapter({ token: '123' })
                .getGroupsForUser('abc999');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            (/\/member\//).test(req.url).should.be.true;
            (/userId=abc999/).test(req.url).should.be.true;
            (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
        });

        it('should call GET on the Member API with the userId parameter, as an object, and the token', function () {
            createMemberAdapter({ token: '123' })
                .getGroupsForUser({ userId: 'abc999' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            (/\/member\//).test(req.url).should.be.true;
            (/userId=abc999/).test(req.url).should.be.true;
            (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
        });

        it('should throw error when no userId is specified', function () {
            var getGroupsForUser = function () {
                createMemberAdapter({ token: '123', store: { cookie: cookieDummy } }).getGroupsForUser();
            };
            expect(getGroupsForUser).to.throw(Error);
        });
    });

    describe('#getGroupDetails', function () {
        it('should call GET on the Member API with the group parameter in the URL and the token', function () {
            createMemberAdapter({ token: '123' })
                .getGroupDetails('abc999');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            (/\/member\/local\/abc999/).test(req.url).should.be.true;
            (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
        });

        it('should call GET on the Member API with the group parameter, as an object, in the URL and the token', function () {
            createMemberAdapter({ token: '123' })
                .getGroupDetails({ groupId: 'abc999' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            (/\/member\/local\/abc999/).test(req.url).should.be.true;
            (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
        });

        it('should throw error when no groupId is specified', function () {
            var getGroupDetails = function () {
                createMemberAdapter({ token: '123', store: { cookie: cookieDummy } }).getGroupDetails();
            };
            expect(getGroupDetails).to.throw(Error);
        });
    });

    var testPatchUserActiveField = function (active) {
        var method = active ? 'makeUserActive' : 'makeUserInactive';
        createMemberAdapter()[method]({ userId: '123', groupId: 'abc' });

        var req = server.requests.pop();
        expect(req.method).to.equal('PATCH');
        expect(req.url).to.match(/\/member\/local\/abc\?userId=123/);
        expect(req.requestBody).to.eq(JSON.stringify({ active: active }));
    };

    var testPatchMultiUserActiveField = function (active) {
        var method = active ? 'makeUserActive' : 'makeUserInactive';
        createMemberAdapter()[method]({ userId: ['123', '132', '213'], groupId: 'abc' });

        var req = server.requests.pop();
        expect(req.method).to.equal('PATCH');
        expect(req.url).to.match(/\/member\/local\/abc\?userId=123&userId=132&userId=213/);
        expect(req.requestBody).to.eq(JSON.stringify({ active: active }));
    };

    describe('#makeUserActive', function () {
        it('should PATCH the member/local/<groupId>/<userId> to set active equal to true', function () {
            testPatchUserActiveField(true);
        });

        it('should PATCH the member/local/<groupId>?userId=<userId>&userId=<userId>...', function () {
            testPatchMultiUserActiveField(true);
        });

        it('should inclide the authorization header', function () {
            createMemberAdapter({ token: '123' }).makeUserActive({ userId: '123', groupId: 'abc' });

            var req = server.requests.pop();
            expect(req.requestHeaders.Authorization).to.match(/Bearer 123/);
        });
    });

    describe('#addUsersToGroup', ()=> {
        it('should throw an error if no userid provided', ()=> {
            const fn = ()=> createMemberAdapter().addUsersToGroup();
            expect(fn).to.throw(/addUsersToGroup/);
        });
        it('should throw an error if no groupid provided', ()=> {
            const fn = ()=> createMemberAdapter().addUsersToGroup(['foo']);
            expect(fn).to.throw(/addUsersToGroup/);
        });
        it('should do a POST to the right URL', ()=> {
            const userList = [{ userId: 'user1' }, { userId: 'user2' }];
            return createMemberAdapter().addUsersToGroup(userList, 'foobar').then(()=> {
                const req = server.requests.pop();
                expect(req.method.toUpperCase()).to.equal('POST');
                expect(req.url).to.equal(`${baseURL}foobar`);
                expect(req.requestBody).to.equal(JSON.stringify(userList));
            });
        });
        it('should accept string userids', ()=> {
            const userList = [{ userId: 'user1' }, { userId: 'user2' }];
            const userids = userList.map((u)=> u.userId);
            return createMemberAdapter().addUsersToGroup(userids, 'foobar').then(()=> {
                const req = server.requests.pop();
                expect(req.requestBody).to.equal(JSON.stringify(userList));
            });
        });
    });
    describe('#makeUserInactive', function () {
        it('should PATCH the member/local/<groupId>/<userId> to set active equal to false', function () {
            testPatchUserActiveField(false);
        });

        it('should PATCH the member/local/<groupId>?userId=<userId>&userId=<userId>...', function () {
            testPatchMultiUserActiveField(false);
        });

        it('should inclide the authorization header', function () {
            createMemberAdapter({ token: '123' }).makeUserInactive({ userId: '123', groupId: 'abc' });

            var req = server.requests.pop();
            expect(req.requestHeaders.Authorization).to.match(/Bearer 123/);
        });
    });
});

