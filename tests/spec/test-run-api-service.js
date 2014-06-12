(function () {
    'use strict';

    var RunService = F.service.Run;

    describe('Run API Service', function () {
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

        describe('#create()', function () {
            it('should do a POST', function() {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.create({model: 'model.jl'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });
            it('should pass through run options', function() {
                var params = {model: 'model.jl'};

                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.create(params);

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify(params));
            });

        });
        describe('#query()', function () {
            it('should do a GET', function() {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should convert filters to matrix parameters', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price=>1/');

            });
            it('should convert op modifiers to query strings', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({}, {page: 1, limit:2});

                var req = server.requests.pop();
                //TODO: See what the api does in this case
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/?page=1&limit=2');
            });
        });

        describe('#load()', function () {
            it('should take in a run id and query the server', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.load('myfancyrunid', {include: 'score'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/myfancyrunid/?include=score');
            });
        });

        //Operations
        describe('Run#Operations', function() {
            describe('#do', function() {
                it('should do a POST', function() {
                    var rs = new RunService({account: 'forio', project: 'js-libs'});
                    rs.do('add', [1,2]);

                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('POST');
                });
                it('should take in operation names and send to server', function() {
                    var rs = new RunService({account: 'forio', project: 'js-libs'});
                    rs.do('add', [1,2]);

                    var req = server.requests.pop();
                    req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/operations/add/');
                    req.requestBody.should.equal(JSON.stringify([1,2]));
                });
                it('should call success callback on success', function () {
                    var callback = function() {
                        console.log('Ops do success');
                    };
                    var spy = sinon.spy(callback);

                    var rs = new RunService({account: 'forio', project: 'js-libs'});
                    rs.do('add', [1,2], {success: spy });

                    server.respond();
                    spy.called.should.equal(true);
                });
            });

            describe('#serial', function () {
                it('should send multiple operations calls once by one', function () {
                    server.requests = [];

                    var rs = new RunService({account: 'forio', project: 'js-libs'});
                    rs.serial([{first: [1,2]}, {second: [2,3]}]);
                    server.respond();

                    // sinon.assert.callOrder(spy1, spy2, ...)
                    server.requests.length.should.equal(2);
                    server.requests[0].url.should.equal('https://api.forio.com/run/forio/js-libs/;/operations/first/');
                    server.requests[1].url.should.equal('https://api.forio.com/run/forio/js-libs/;/operations/second/');

                });
            });

            describe('#parallel', function () {
                it('should send multiple operations calls once by one', function () {
                    server.requests = [];

                    var rs = new RunService({account: 'forio', project: 'js-libs'});
                    rs.parallel([{first: [1,2]}, {second: [2,3]}]);
                    server.respond();

                    // sinon.assert.callOrder(spy1, spy2, ...)
                    server.requests.length.should.equal(2);
                });
            });

        });
    });
})();
