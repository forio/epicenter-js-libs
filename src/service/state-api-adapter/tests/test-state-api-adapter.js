import StateService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

var baseURL = (new URLService()).getAPIPath('model/state');

describe('State API Adapter', function () {
    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith(/(.*)\/state\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
        });
    });

    after(function () {
        server.restore();
    });

    it('should pass through string tokens', function () {
        var ss = new StateService({ token: 'abc' });
        ss.replay({ runId: 'X' });

        var req = server.requests.pop();
        req.requestHeaders.Authorization.should.equal('Bearer abc');
    });

    it('should pass in transport options to the underlying ajax handler', function () {
        var callback = sinon.spy();
        var ss = new StateService({ transport: { beforeSend: callback } });
        ss.replay({ runId: 'X' });

        server.respond();
        callback.should.have.been.called;
    });

    describe('#load', function () {
        it('should do a GET', function () {
            var ss = new StateService();
            ss.load('X');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
        });
        it('should hit the right url', function () {
            var ss = new StateService();
            ss.load('X');

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'X');
        });
    });

    describe('#replay', function () {
        it('Should do a POST', function () {
            var ss = new StateService();
            ss.replay({ runId: 'X' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('POST');
        });

        it('should hit the right url', function () {
            var ss = new StateService();
            ss.replay({ runId: 'X' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'X');
        });
        //Hold off till 2.0
        it.skip('should allow string runiss', function () {
            var ss = new StateService();
            ss.replay('X');

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'X');
        });
        it('should throw an error if runid is not provided', function () {
            var ss = new StateService();
            var ret = function () { ss.replay(); };
            ret.should.throw(Error);
        });

        it('should only allow white-listed parameters', function () {
            var ss = new StateService();
            ss.replay({ runId: 'X', stopBefore: 'Y' });

            var req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({ action: 'replay', stopBefore: 'Y' }));

            ss.replay({ runId: 'X', stopBefore: 'Y', exclude: 'Z' });

            req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({ action: 'replay', stopBefore: 'Y', exclude: 'Z' }));
        });
        it('should now allow non-white-listed parameters', function () {
            var ss = new StateService();
            ss.replay({ runId: 'X', stopBefore: 'Y' });

            ss.replay({ runId: 'X', stopBefore: 'Y', include: 'Z' });
            var req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({ action: 'replay', stopBefore: 'Y' }));
        });
    });

    describe('#rewind', function () {
        it('Should do a POST', function () {
            var ss = new StateService();
            ss.rewind({ runId: 'X' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('POST');
        });

        it('should hit the right url', function () {
            var ss = new StateService();
            ss.rewind({ runId: 'X' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'rewind/X');
        });
        it('should throw an error if runid is not provided', function () {
            var ss = new StateService();
            var ret = function () { ss.rewind(); };
            ret.should.throw(Error);
        });

        it('should post with an empty body', function () {
            var ss = new StateService();
            ss.rewind({ runId: 'X' });

            var req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({}));
        });
    });
    describe('#clone', function () {
        it('Should do a POST', function () {
            var ss = new StateService();
            ss.clone({ runId: 'X' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('POST');
        });

        it('should hit the right url', function () {
            var ss = new StateService();
            ss.clone({ runId: 'X' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'X');
        });
        it('should throw an error if runid is not provided', function () {
            var ss = new StateService();
            var ret = function () { ss.clone(); };
            ret.should.throw(Error);
        });

        it('should only allow white-listed parameters', function () {
            var ss = new StateService();
            ss.clone({ runId: 'X', stopBefore: 'Y' });

            var req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({ action: 'clone', stopBefore: 'Y' }));

            ss.clone({ runId: 'X', stopBefore: 'Y', exclude: 'Z' });

            req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({ action: 'clone', stopBefore: 'Y', exclude: 'Z' }));
        });
        it('should now allow non-white-listed parameters', function () {
            var ss = new StateService();
            ss.clone({ runId: 'X', stopBefore: 'Y' });

            ss.clone({ runId: 'X', stopBefore: 'Y', include: 'Z' });
            var req = server.requests.pop();
            req.requestBody.should.equal(JSON.stringify({ action: 'clone', stopBefore: 'Y' }));
        });
    });
});
