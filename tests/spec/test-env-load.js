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
            server.respondImmediately = true;
        });

        afterEach(function () {
            server.restore();
        });

        describe('load', function () {
            it('should request the server env url', function () {
                var oldDefaults = $.extend({}, F.service.URL.defaults);
                F.service.URL.defaults.isLocalhost = function () { return false; };
                F.load();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                req.url.should.equal('/epicenter/v1/config');

                F.service.URL.defaults = oldDefaults;
            });
            it('should default to forio.com for localhost', function () {
                var oldDefaults = $.extend({}, F.service.URL.defaults);
                F.service.URL.defaults.isLocalhost = function () { return true; };
                F.load();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                req.url.should.equal('https://forio.com/epicenter/v1/config');

                F.service.URL.defaults = oldDefaults;
            });

            it('should set protocol and host to the UrlConfingService', function (done) {
                server.respondWith('GET', /(.*)\/epicenter\/(.*)\/config/, function (xhr, id) {
                    xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(env));
                });
                var oldDefaults = $.extend({}, F.service.URL.defaults);
                F.service.URL.defaults = {};
                F.load(function () {
                    F.service.URL.defaults.protocol.should.equal('https');
                    F.service.URL.defaults.host.should.equal('customapi.forio.com');
                    F.service.URL.defaults = oldDefaults;
                    done();
                });
            });

            it('should set protocol and host to api.forio.com when the config request fails', function () {
                server.respondWith('GET', /(.*)\/epicenter\/(.*)\/config/, function (xhr, id) {
                    xhr.respond(404, { 'Content-Type': 'application/json' }, JSON.stringify({ message: 'Not Found on Server' }));
                });
                var oldDefaults = $.extend({}, F.service.URL.defaults);
                F.service.URL.defaults = {};
                var callback = sinon.spy();
                F.load(function () {
                    F.service.URL.defaults.protocol.should.equal('https');
                    F.service.URL.defaults.host.should.equal('api.forio.com');
                    F.service.URL.defaults = oldDefaults;
                }).then(null, callback).then(function () {
                    callback.should.have.been.called;
                });
            });
        });
    });
}());
