(function () {
    'use strict';

    var StateService = F.service.State;

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
            var ds = new StateService({ root: 'person', account: 'forio', project: 'js-libs', token: 'abc' });
            ds.replay({ runId: 'X' });

            var req = server.requests.pop();
            req.requestHeaders.Authorization.should.equal('Bearer abc');
        });

        it('should pass in transport options to the underlying ajax handler', function () {
            var callback = sinon.spy();
            var ds = new StateService({ root: 'person', account: 'forio', project: 'js-libs', transport: { beforeSend: callback } });
            ds.replay({ runId: 'X' });

            server.respond();
            callback.should.have.been.called;
        });

        describe('#replay', function () {
            it('Should do a POST', function () {
                var ds = new StateService({ root: 'person', account: 'forio', project: 'js-libs' });
                ds.replay({ runId: 'X' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });

            it('should hit the right url', function () {
                var ds = new StateService({ root: 'person', account: 'forio', project: 'js-libs' });
                ds.replay({ runId: 'X' });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/model/state/X');
            });
            it('should throw an error if runid is not provided', function () {
                var ds = new StateService({ root: 'person', account: 'forio', project: 'js-libs' });
                var ret =  function () { ds.replay(); };
                ret.should.throw(Error);
            });
        });
    });
}());
