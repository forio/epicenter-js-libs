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
            it('POSTs to the base URL', function() {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.create({model: 'model.jl'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/');
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
            it('should be idempotent across multiple queries', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price=>1/');

                rs.query({saved: false, '.sales': '<4'});
                req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=false;.sales=<4/');
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
            it('should do an GET', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.load('myfancyrunid', {include: 'score'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });

            it('should take in a run id and query the server', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.load('myfancyrunid', {include: 'score'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/myfancyrunid/?include=score');
            });
        });

        describe('#save()', function () {
            it('should do an PATCH', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.save({completed: true});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
            });

            it('should take in options and send to server', function () {
                var params = {completed: true};
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.save(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/');
                req.requestBody.should.equal(JSON.stringify(params));

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
        describe('#urlConfig', function () {
            it('should be set after #query', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'});

                rs.urlConfig.filter = ';saved=true;.price=>1';

                rs.query({saved: false, '.sales': '<4'});
                rs.urlConfig.filter = ';saved=false;.sales=<4';
            });


            it('should be set after #load', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.load('myfancyrunid', {include: 'score'});

                rs.urlConfig.filter = 'myfancyrunid';

                rs.load('myfancyrunid2', {include: 'score'});
                rs.urlConfig.filter = 'myfancyrunid2';
            });

        });
    });
})();
