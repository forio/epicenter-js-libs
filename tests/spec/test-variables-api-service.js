(function() {

    var rutil = F.util.run;
    var RunService = F.service.Run;

    describe('Variables Service', function () {
        var server, rs, vs;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/run\/(.*)\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.autoRespond = true;

            rs = new RunService({account: 'forio', project: 'js-libs'});
            vs = rs.variables();
        });

        after(function () {
            server.restore();
            rs = null;
            vs = null;
        });

        describe('#load()', function () {
            it('should do a GET', function () {
                vs.load('price');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should use the right url', function () {
                vs.load('price');
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/price/');
            });
        });

        describe('#query()', function () {
            it('should do a GET', function () {
                vs.query(['price', 'sales']);
                server.respond();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should convert includes', function () {
                vs.query({include: ['price', 'sales']});
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/?include=price,sales');
            });
            it('should convert sets', function () {
                vs.query({set: 'a'});
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/?set=a');
            });
            it('should convert sets & includes', function () {
                vs.query({set: ['a', 'b'], include: 'price'});
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/?set=a,b&include=price');
            });
        });


        describe('#save()', function () {
            it('should do a POST', function () {
                vs.save({a: 1, b: 2});
                server.respond();


                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });

            it('should send requests in the body', function () {
                var params = {a: 1, b: 2};
                vs.save(params);
                server.respond();


                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/');
                req.requestBody.should.equal(JSON.stringify(params));
            });
            it('should support setting key, value syntax', function () {
                vs.save('a', 1);
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/');
                req.requestBody.should.equal(JSON.stringify({a: 1}));
            });
        });

        describe('#merge()', function () {
            it('should do a PATCH', function () {
                vs.merge({a: 1, b: 2});
                server.respond();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
            });

            it('should send requests in the body', function () {
                var params = {a: 1, b: 2};
                vs.merge(params);
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/');
                req.requestBody.should.equal(JSON.stringify(params));
            });

            it('should support setting key, value syntax', function () {
                vs.merge('a', 1);
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variables/');
                req.requestBody.should.equal(JSON.stringify({a: 1}));
            });
        });

        describe('#end', function () {
            it('should return run service', function () {
                var rs = vs.end();
                rs.should.be.instanceof(RunService);
            });
        });
        describe('Callbacks', function () {
            describe('#load', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    vs.load('sales', null, {success: cb1});

                    server.respond();
                    cb1.called.should.equal(true);
                });
            });
            describe('#query', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    vs.query({include: ['price', 'sales']}, null, {success: cb1});

                    server.respond();
                    cb1.called.should.equal(true);
                });
            });
            describe('#save', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    var cb2 = sinon.spy();
                    vs.save({a: 1, b: 2}, {success: cb1});
                    vs.save('a', 1, {success: cb2});

                    server.respond();
                    cb1.called.should.equal(true);
                    cb2.called.should.equal(true);
                });
            });
            describe('#merge', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    var cb2 = sinon.spy();
                    vs.merge({a: 1, b: 2}, {success: cb1});
                    vs.merge('a', 1, {success: cb2});

                    server.respond();
                    cb1.called.should.equal(true);
                    cb2.called.should.equal(true);
                });
            });
        });
    });
}());
