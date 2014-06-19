(function() {

    var AuthService = F.service.Auth ;

    describe('Auth Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/run\/(.*)\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        describe('#login', function () {
            it('should do a GET', function () {
                var as = new AuthService();
                as.login('user', 'pass');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should send requests to body', function () {
                var as = new AuthService();
                as.login('user', 'pass');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                req.url.should.equal('https://api.forio.com/authentication/');
                req.requestBody.should.equal(JSON.stringify({username: 'user', password: 'pass'}));
            });
        });
        describe('#logout', function () {
            //Test 401
        });

    });

}());
