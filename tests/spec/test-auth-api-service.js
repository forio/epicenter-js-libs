(function () {
    'use strict';

    var AuthService = F.service.Auth ;
    var baseURL = (new F.service.URL()).getAPIPath('authentication');

    describe('Auth Service', function () {
        var server, token;
        before(function () {
            token = 'tHDEVEueL7tuC8LYRj4lhWhYe3GDreWPzGx';
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/authentication/, function (xhr, id) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(
                    { 'refresh_token':'snip-refresh','access_token': token,'expires':43199 }
                    ));
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
            token = null;
        });

        it('should pass in transport options to the underlying ajax handler', function () {
            var callback = sinon.spy();
            var as = new AuthService({ transport: { beforeSend: callback } });
            as.login({ userName: 'john', password: 'y' });

            server.respond();
            callback.should.have.been.called;
        });

        describe('#login', function () {
            // it('should require username and password', function () {
            //     var as = new AuthService();
            //     var ret = function () { as.login();};
            //     ret.should.throw(Error);
            // });

            it('should do a POST', function () {
                var as = new AuthService();
                as.login({ userName: 'john', password: 'y' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });
            it('should go to the right url', function () {
                var as = new AuthService();
                as.login({ userName: 'john', password: 'y' });

                var req = server.requests.pop();
                req.url.should.equal(baseURL);
            });
            it('should send requests to body', function () {
                var as = new AuthService();
                as.login({ userName: 'john', password: 'y', account: 'x' });

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify({ userName: 'john', password: 'y', account: 'x' }));
            });

            it('should allow logging in with no account', function () {
                var as = new AuthService();
                as.login({ userName: 'john', password: 'y', account: null });

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify({ userName: 'john', password: 'y' }));
            });

            it('should pick up creds from service options', function () {
                var as = new AuthService({ userName: 'john', password: 'y' });
                as.login();

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify({ userName: 'john', password: 'y' }));
            });
        });
        describe('#logout', function () {
            // TODO: Test we are calling the API
        });
    });
}());
