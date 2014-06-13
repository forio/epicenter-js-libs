(function() {

    var rutil = F.util.run;
    var RunService = F.service.Run;

    describe('Variable Service', function () {
        var server, rs, vs;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/run\/(.*)\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.autoRespond = true;

            rs = new RunService({account: 'forio', project: 'js-libs'});
            vs = rs.variable();
        });

        after(function () {
            server.restore();
            rs = null;
            vs = null;
        });


        describe('#save()', function () {
            it('should do an POST', function () {
                vs.save({a: 1, b: 2});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });

            it('should send requests in the body', function () {
                var params = {a: 1, b: 2};
                vs.merge(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/');
                req.requestBody.should.equal(JSON.stringify(params));
            });
        });

        describe('#merge()', function () {
            it('should do an PATCH', function () {
                vs.merge({a: 1, b: 2});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
            });

            it('should send requests in the body', function () {
                var params = {a: 1, b: 2};
                vs.merge(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/');
                req.requestBody.should.equal(JSON.stringify(params));
            });
        });
    });
}());
