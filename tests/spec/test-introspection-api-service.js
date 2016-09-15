(function () {
    'use strict';

    var IntroService = F.service.Introspect;
    var baseURL = (new F.service.URL()).getAPIPath('model/introspect');

    describe('Introspection API Adapter', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/introspect\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
        });

        after(function () {
            server.restore();
        });

        it('should pass through string tokens', function () {
            var ds = new IntroService({ account: 'X', project: 'Y', token: 'abc' });
            ds.byModel('anc');

            var req = server.requests.pop();
            req.requestHeaders.Authorization.should.equal('Bearer abc');
        });

        it('should pass in transport options to the underlying ajax handler', function () {
            var callback = sinon.spy();
            var ds = new IntroService({ account: 'X', project: 'Y', transport: { beforeSend: callback } });
            ds.byModel('anc');

            server.respond();
            callback.should.have.been.called;
        });

        describe('#byModel', function () {
            it('should throw an error if account is not specified', function () {
                var ds = new IntroService({ project: 'X' });
                expect(function () { ds.byModel('abc'); }).to.throw(Error);
            });
            it('should throw an error if account is not specified', function () {
                var ds = new IntroService({ account: 'Y' });
                expect(function () { ds.byModel('abc'); }).to.throw(Error);
            });
            it('should throw an error if model is not specified', function () {
                var ds = new IntroService({ account: 'Y' });
                expect(function () { ds.byModel(); }).to.throw(Error);
            });
            it('should do a GET', function () {
                var ds = new IntroService({ account: 'X', project: 'Y' });
                ds.byModel('abc');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should hit the right url', function () {
                var ds = new IntroService({ account: 'X', project: 'Y' });
                ds.byModel('abc.vmf');
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'X/Y/abc.vmf');
            });
        });
    });
}());
