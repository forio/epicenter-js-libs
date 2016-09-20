(function () {
    'use strict';

    var server;
    // var setupResponse = function (verb, endpoint, statusCode, resp, respHeaders) {
    //     server.respondWith(verb, endpoint, function (xhr, id) {
    //         var headers = _.extend({}, { 'Content-Type': 'application/json' }, respHeaders);
    //         var body = typeof resp === 'object' ? JSON.stringify(resp) : resp;
    //         xhr.respond(statusCode, headers, body);
    //     });
    // };
    describe('User API Service', function () {
        before(function () {
            server = sinon.fakeServer.create();
            server.respondImmediately = true;
        });

        after(function () {
            server.restore();
        });

        function createUserAdapter(options) {
            return new F.service.User(_.extend({
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
})();
