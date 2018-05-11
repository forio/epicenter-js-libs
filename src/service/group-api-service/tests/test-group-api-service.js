import GroupService from '../index';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

describe('Group API Service', function () {
    var server;
        
    before(function () {
        server = sinon.fakeServer.create();
        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });

    function createUserAdapter(options) {
        return new GroupService(Object.assign({
            token: 'some-token'
        }, options));
    }

    it('should use token as authorization header if passed', function () {
        createUserAdapter().getGroups();

        var req = server.requests.pop();
        req.requestHeaders.Authorization.should.equal('Bearer some-token');
    });

    it('should GET the group api with account and project', function () {
        createUserAdapter().getGroups({ account: 'forio', project: 'project' });

        var req = server.requests.pop();
        req.url.should.match(/account=forio/);
        req.url.should.match(/project=project/);
    });

    it('should GET the group api with groupID as the string', function () {
        createUserAdapter().getGroups('my-group-id');

        var req = server.requests.pop();
        req.url.should.match(/group\/local\/my-group-id/);
    });
});
