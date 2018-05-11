import UserService from '../index';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

describe('User API Service', function () {
    var server;
    
    before(function () {
        server = sinon.fakeServer.create();
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

    it('should use token as authorization header if passed', function () {
        createUserAdapter().get();

        var req = server.requests.pop();
        req.requestHeaders.Authorization.should.equal('Bearer some-token');
    });

    it('should GET on user api with account if parameter', function () {
        createUserAdapter().get();

        var req = server.requests.pop();
        req.url.should.match(/account=forio/);
    });

    it('should GET with user id if passed in filters', function () {
        createUserAdapter().get({ id: '123' });

        var req = server.requests.pop();
        req.url.should.match(/id=123/);
    });

    it('should GET with multiple ids if filter.id is an array of ids', function () {
        createUserAdapter().get({ id: ['123', '345'] });

        var req = server.requests.pop();
        req.url.should.match(/id=123&id=345/);
    });

    it('should GET with q=<string> if username is passed in filters', function () {
        createUserAdapter().get({ userName: 'u12' });

        var req = server.requests.pop();
        req.url.should.match(/q=u12/);
    });
});