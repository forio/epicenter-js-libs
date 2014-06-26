(function() {

    var AuthService = F.service.Auth ;

    describe('Auth Service', function () {
        var server, token;
        before(function () {
            token = 'tHDEVEueL7tuC8LYRj4lhWhYe3GDreWPzGx';
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/authentication/, function (xhr, id){
                xhr.respond(201, { 'Content-Type': 'application/json'}, JSON.stringify(
                    {"refresh_token":"snip-refresh","access_token": token,"expires":43199}
                    ));
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
            token = null;
        });

        describe('#login', function () {
            it('should require username and password', function () {
                var as = new AuthService();
                (function(){ as.login();}).should.throw(Error);
            });

            it('should do a POST', function () {
                var as = new AuthService();
                as.login({userName: 'john', password: 'y'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });
            it('should go to the right url', function () {
                var as = new AuthService();
                as.login({userName: 'john', password: 'y'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/authentication/');
            });
            it('should send requests to body', function () {
                var as = new AuthService();
                as.login({userName: 'john', password: 'y'});

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify({userName: 'john', password: 'y'}));
            });

            it('should pick up creds from service options', function () {
                var as = new AuthService({userName: 'john', password: 'y'});
                as.login();

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify({userName: 'john', password: 'y'}));
            });

            it('should set a cookie after being logged in', function () {
                //need to set domain to blank for testing locally
                var as = new AuthService({userName: 'john', password: 'y', store: {domain: ''}});
                as.login();

                server.respond();

                var store = as.store;
                var storeToken = store.get('epicenter.token');
                storeToken.should.equal(token);
            });


        });
        describe('#logout', function () {

            //Test 401
        });

    });

}());
