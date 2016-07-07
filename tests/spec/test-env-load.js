(function () {
    'use strict';
    describe('Env Load', function () {
        var env = {
            api: {
                host: 'customapi.forio.com',
                protocol: 'https'
            }
        };
        var server;
        beforeEach(function () {
            server = sinon.fakeServer.create();
            server.autoRespond = true;
        });

        afterEach(function () {
            server.restore();
        });

        describe('load', function () {
            it('it should request the server env url', function () {
                F.load();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                req.url.should.equal('https://forio.com/epicenter/v1/config');
            });

            it('it should set protocol and host to the UrlConfingService', function () {
                server.respondWith('GET', 'https://forio.com/epicenter/v1/config', function (xhr, id) {
                    xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(env));
                });
                delete F.service.URL.protocol;
                delete F.service.URL.host;
                F.load(function () {
                    F.service.URL.protocol.should.equal('https');
                    F.service.URL.host.should.equal('customapi.forio.com');
                    delete F.service.URL.protocol;
                    delete F.service.URL.host;
                    //done();
                });
                //server.respond();
            });

            it('it should set protocol and host to api.forio.com when the config request fails', function () {
                server.respondWith('GET', 'https://forio.com/epicenter/v1/config', function (xhr, id) {
                    xhr.respond(404, { 'Content-Type': 'application/json' }, JSON.stringify({ message: 'Not Found on Server' }));
                });
                delete F.service.URL.protocol;
                delete F.service.URL.host;
                var callback = sinon.spy();
                F.load(function () {
                    F.service.URL.protocol.should.equal('https');
                    F.service.URL.host.should.equal('api.forio.com');
                    delete F.service.URL.protocol;
                    delete F.service.URL.host;
                }).fail(callback);
                callback.should.have.been.called;
            });
        });
    });
})();