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

        describe('#get()', function () {
            it('Should do a GET', function () {
                it('should do a GET', function () {
                    vs.get('price');

                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('GET');
                });
                it('should use the right url', function () {
                    vs.get('price');

                    var req = server.requests.pop();
                    req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/price/');
                });
            });
        });

        describe('#query()', function () {
            it('should do a GET', function () {
                vs.query(['price', 'sales']);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should convert includes', function () {
                vs.query({include: ['price', 'sales']});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/?include=price,sales');
            });
            it('should convert sets', function () {
                vs.query({set: 'a'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/?set=a');
            });
            it('should convert sets & includes', function () {
                vs.query({set: ['a', 'b'], include: 'price'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/?set=a,b&include=price');
            });
        });


        describe('#save()', function () {
            it('should do a POST', function () {
                vs.save({a: 1, b: 2});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });

            it('should send requests in the body', function () {
                var params = {a: 1, b: 2};
                vs.save(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/');
                req.requestBody.should.equal(JSON.stringify(params));
            });
            it('should support setting key, value syntax', function () {
                vs.save('a', 1);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/');
                req.requestBody.should.equal(JSON.stringify({a: 1}));
            });
        });

        describe('#merge()', function () {
            it('should do a PATCH', function () {
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

            it('should support setting key, value syntax', function () {
                vs.merge('a', 1);
                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/variable/');
                req.requestBody.should.equal(JSON.stringify({a: 1}));
            });
        });

        describe('Callbacks', function () {
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
            describe('#query', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    vs.query({include: ['price', 'sales']}, null, {success: cb1});

                    server.respond();
                    cb1.called.should.equal(true);
                });
            });
            describe('#get', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    vs.get('sales', null, {success: cb1});

                    server.respond();
                    cb1.called.should.equal(true);
                });
            });
        });
    });
}());
