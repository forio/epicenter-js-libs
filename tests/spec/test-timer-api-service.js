(function() {
    'use strict';
    var TimeService = F.service.Time;

    var baseURL = (new F.service.URL()).getAPIPath('time');

    describe.only('Timer API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/time/, function (xhr, id) {
                var date = (new Date(Date.now())).toISOString();
                xhr.respond(200, { 'Content-Type': 'text/plain' }, date);
            });
            server.respondImmediately = true;
        });

        afterEach(function () {
            server.requests = [];
        });
        after(function () {
            server.restore();
        });

        it('should do a GET', function () {
            var ts = new TimeService();
            return ts.getTime().then(function () {
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
        });
        it('should hit the right url', function () {
            var ts = new TimeService();
            return ts.getTime().then(function () {
                var req = server.requests.pop();
                req.url.should.equal(baseURL);
            });
        });
        it('should respect server config', function () {
            var ts = new TimeService({
                server: {
                    host: 'foobar.com'
                }
            });
            return ts.getTime().then(function () {
                var req = server.requests.pop();
                req.url.should.equal('https://foobar.com/v2/time/');
            });
        });
        it('should return a date object', function () {
            var ts = new TimeService();
            return ts.getTime().then(function (t) {
                t.should.be.instanceof(Date);
            });
        });
    });
}());
