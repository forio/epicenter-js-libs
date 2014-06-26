(function() {

    var AuthService = F.service.Auth ;

    describe('Auth Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/auth\/(.*)\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        describe('#login', function () {
            it('should require username and password', function () {
                var as = new AuthService();
                (function(){ as.login();}).should.throw(Error);
            });

            it('should do a GET', function () {
                var as = new AuthService();
                as.login({userName: 'john', password: 'y'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should send requests to body', function () {
                var as = new AuthService();
                as.login({userName: 'john', password: 'y'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                req.url.should.equal('https://api.forio.com/authentication/');
                req.requestBody.should.equal(JSON.stringify({userName: 'john', password: 'pass'}));
            });

            it('should pick up creds from service options', function () {
                var as = new AuthService({userName: 'john', password: 'y'});
                as.login();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                req.url.should.equal('https://api.forio.com/authentication/');
                req.requestBody.should.equal(JSON.stringify({userName: 'john', password: 'pass'}));
            });
        });
        describe('#logout', function () {
            //Test 401
        });

    });

}());
