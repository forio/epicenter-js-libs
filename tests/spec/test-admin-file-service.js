'use strict';
(function () {

    var FileService = F.service.File;

    describe('File API Adapter', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/file\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
        });

        after(function () {
            server.restore();
        });

        it('should pass through string tokens', function () {
            var fs = new FileService({ token: 'xyz' });
            fs.getContents('file', 'model');

            var req = server.requests.pop();
            req.requestHeaders.Authorization.should.equal('Bearer xyz');
        });

        it('should pass in transport options to the underlying ajax handler', function () {
            var callback = sinon.spy();
            var fs = new FileService({ account: 'forio', project: 'js-libs', transport: { beforeSend: callback } });
            fs.getContents('file', 'model');

            server.respond();
            callback.should.have.been.called;
        });

        describe('#getContents', function () {
            it('Should do a GET', function () {
                var fs = new FileService({ account: 'forio', project: 'js-libs' });
                fs.getContents('file', 'model');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });

            it('should hit the right url', function () {
                var fs = new FileService({ account: 'forio', project: 'js-libs' });
                fs.getContents('file', 'model');

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/file/forio/js-libs/model/file');
            });
        });
    });
}());
