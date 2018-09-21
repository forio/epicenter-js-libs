import UserService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai, { expect } from 'chai';
chai.use(require('sinon-chai'));

var account = 'forio';
var project = 'js-libs';
var baseURL = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('user');

describe('User API Service', function () {
    var server;
    
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith(/(.*)\/user/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
        });
        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });

    function createUserAdapter(options) {
        return new UserService(Object.assign({
            account: 'forio',
            token: 'some-token'
        }, options));
    }

    describe('#get', ()=> {
        it('should use token as authorization header if passed', function () {
            return createUserAdapter().get().then(()=> {
                var req = server.requests.pop();
                req.requestHeaders.Authorization.should.equal('Bearer some-token');
            });
        });
    
        it('should GET on user api with account if parameter', function () {
            return createUserAdapter().get().then(()=> {
                var req = server.requests.pop();
                req.url.should.match(/account=forio/);
            });
        });
    
        it('should GET with user id if passed in filters', function () {
            return createUserAdapter().get({ id: '123' }).then(()=> {
                var req = server.requests.pop();
                req.url.should.match(/id=123/);
            });
        });
    
        it('should GET with multiple ids if filter.id is an array of ids', function () {
            return createUserAdapter().get({ id: ['123', '345'] }).then(()=> {
                var req = server.requests.pop();
                req.url.should.match(/id=123&id=345/);
            });
        });
    
        it('should GET with q=<string> if username is passed in filters', function () {
            return createUserAdapter().get({ userName: 'u12' }).then(()=> {
                var req = server.requests.pop();
                req.url.should.match(/q=u12/);
            });
        });
    });
    describe.only('#uploadUsers', ()=> {
        it('should do a POST to the right URL', ()=> {
            return createUserAdapter().uploadUsers([{ userName: 'foo', password: 'bar', firstName: 'X', lastName: 'Y' }]).then(()=> {
                const req = server.requests.pop();
                expect(req.method.toUpperCase()).to.equal('POST');
                expect(req.url).to.equal(baseURL);
            });
        });

        describe('Invalid Users', ()=> {
            it('should throw an error if no userlist provided', ()=> {
                const successSpy = sinon.spy();
                const failSpy = sinon.spy();
                return createUserAdapter().uploadUsers().then(successSpy).catch(failSpy).then(()=> {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.calledOnce;

                    const failArgs = failSpy.getCall(0).args[0];
                    expect(failArgs.type).to.equal('INVALID_USERS');
                });
                
            });
            it('should throw an error if userlist provided in the wrong format', ()=> {
                const successSpy = sinon.spy();
                const failSpy = sinon.spy();
                return createUserAdapter().uploadUsers('foobar').then(successSpy).catch(failSpy).then(()=> {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.calledOnce;

                    const failArgs = failSpy.getCall(0).args[0];
                    expect(failArgs.type).to.equal('INVALID_USERS');
                });
            });

            it('should return a rejected promise if user format does not have required fields', ()=> {
                const successSpy = sinon.spy();
                const failSpy = sinon.spy();
                return createUserAdapter().uploadUsers([{ userName: 'blah' }]).then(successSpy).catch(failSpy).then(()=> {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.calledOnce;

                    const failArgs = failSpy.getCall(0).args[0];
                    expect(failArgs.type).to.equal('INVALID_USERS');
                    expect(failArgs.payload[0].user.userName).to.eql('blah');
                });
            });
        });
        describe('Valid Users', ()=> {
            it('should add account from url options if not provided', ()=> {
                const successSpy = sinon.spy();
                const failSpy = sinon.spy();
                const userList = [
                    { userName: 'a', password: 'a', firstName: 'a', lastName: 'a' },
                    { userName: 'b', password: 'b', firstName: 'b', lastName: 'b' },
                ];
                const userListWithAccount = userList.map((u)=> ($.extend({}, u, { account: account })));
                return createUserAdapter().uploadUsers(userList).then(successSpy).catch(failSpy).then(()=> {
                    expect(failSpy).to.not.have.been.called;
                    expect(successSpy).to.have.been.calledOnce;

                    const req = server.requests.pop();
                    expect(req.requestBody).to.equal(JSON.stringify(userListWithAccount));
                });
            });
            it('should throw an error if account is not guessable', ()=> {
                const successSpy = sinon.spy();
                const failSpy = sinon.spy();
                const userList = [
                    { userName: 'a', password: 'a', firstName: 'a', lastName: 'a' },
                    { userName: 'b', password: 'b', firstName: 'b', lastName: 'b' },
                ];
                return createUserAdapter({ account: null }).uploadUsers(userList).then(successSpy).catch(failSpy).then(()=> {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.calledOnce;
                });
            });
        });
    });
    
});