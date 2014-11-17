(function () {
    'use strict';

    var AuthService = F.service.Auth ;

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
            it('should require username and password', function () {
                var as = new AuthService();
                var ret = function () { as.login();};
                ret.should.throw(Error);
            });

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
                req.url.should.equal('https://api.forio.com/authentication/');
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

            it('should set a cookie after being logged in', function () {
                //need to set domain to blank for testing locally
                var as = new AuthService({ userName: 'john', password: 'y', store: { domain: '' } });
                as.login();

                server.respond();

                var store = as.store;
                var storeToken = store.get('epicenter.project.token');
                storeToken.should.equal(token);
            });


        });
        describe('#logout', function () {
            it('should remove cookies', function () {
                //need to set domain to blank for testing locally
                var as = new AuthService({ userName: 'john', password: 'y', store: { domain: '' } });
                as.login();

                server.respond();

                var store = as.store;
                var storeToken = store.get('epicenter.project.token');
                storeToken.should.equal(token);

                as.logout();
                should.not.exist(store.get('epicenter.project.token'));
            });
        });

        describe('#getToken', function () {
            it('should call the server if not called before', function () {
                server.requests = [];

                var as = new AuthService({ userName: 'john', password: 'y', store: { domain: '' } });
                as.getToken();

                server.respond();

                server.requests.length.should.equal(1);
                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/authentication/');
            });

            it('should return existing token if it exists', function () {
                var as = new AuthService({ userName: 'john', password: 'y', store: { domain: '' } });
                as.login();

                server.respond();

                server.requests = [];
                as.getToken();
                server.requests.length.should.equal(0);

                //TODO: How do I move this to destroy?
                as.store.destroy();
            });
        });
    });
}());
