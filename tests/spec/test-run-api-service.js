(function () {
    'use strict';

    var RunService = F.service.Run;
    var VariableService = F.service.Variable;

    describe('Run API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('PATCH',  /(.*)\/run\/(.*)\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.respondWith('GET',  /(.*)\/run\/(.*)\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.respondWith('POST',  /(.*)\/run\/(.*)\/(.*)/,  function (xhr, id){
                var resp = {
                    "id": "065dfe50-d29d-4b55-a0fd-30868d7dd26c",
                    "model": "model.vmf",
                    "account": "mit",
                    "project": "afv",
                    "saved": false,
                    "lastModified": "2014-06-20T04:09:45.738Z",
                    "created": "2014-06-20T04:09:45.738Z"
                };
                xhr.respond(201, { 'Content-Type': 'application/json'}, JSON.stringify(resp));
            });


            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        it('should pass through string tokens', function () {
            var rs = new RunService({account: 'forio', project: 'js-libs', token: 'abc'});
            rs.create('model.jl');

            var req = server.requests.pop();
            req.requestHeaders.Authorization.should.equal('Bearer abc');

            var rs2 = new RunService({account: 'forio', project: 'js-libs'});
            rs2.create('model.jl');

            req = server.requests.pop();
            should.not.exist(req.requestHeaders.Authorization);
        });

        it.skip('should chain', function () {
            var rs = new RunService({account: 'forio', project: 'js-libs', token: 'abc'});
            rs
                .create('model.jl')
                .save({saved: true})
                .query({saved: true});


            server.respond();
            server.respond();
            server.respond();

            server.requests.length.should.equal(3);

            var req = server.requests.shift();
            req.url.should.equal('https://api.forio.com/run/forio/js-libs/');
            req.requestBody.should.equal(JSON.stringify({model: 'model.jl'}));

            req = server.requests.shift();
            req.url.should.equal('https://api.forio.com/run/forio/js-libs/065dfe50-d29d-4b55-a0fd-30868d7dd26c/');
            req.requestBody.should.equal(JSON.stringify({saved: true}));

            req = server.requests.shift();
            req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/');
        });

        it.skip('should return promiseables', function () {
            var callback = sinon.spy();
            var rs = new RunService({account: 'forio', project: 'js-libs'});
            rs
                .create('model.jl')
                .then(callback);

            server.respond();

            callback.should.have.been.called;
            callback.should.have.been.calledWith({
                    "id": "065dfe50-d29d-4b55-a0fd-30868d7dd26c",
                    "model": "model.vmf",
                    "account": "mit",
                    "project": "afv",
                    "saved": false,
                    "lastModified": "2014-06-20T04:09:45.738Z",
                    "created": "2014-06-20T04:09:45.738Z"
                });
            callback.should.have.been.calledOn(rs);

        });
        describe('#create()', function () {
            it('should do a POST', function() {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.create('model.jl');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');

            });
            it('POSTs to the base URL', function() {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.create('model.jl');

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/');
                req.requestBody.should.equal(JSON.stringify({model: 'model.jl'}));

            });

            it('Takes in object params', function() {
                var params = {model: 'model.jl', user: 'x'};

                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.create(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/');
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
                rs.query({saved: true, '.price': '1'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price=1/');
            });

            it('should take matrix params with arithmetic operators', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({a: '<1', b: '>1', c: '!=1', d: '>=1', e: '<=1'}, {include: 'score'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;a<1;b>1;c!=1;d>=1;e<=1/?include=score');
            });

            it('should be idempotent across multiple queries', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price>1/');

                rs.query({saved: false, '.sales': '<4'});
                req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=false;.sales<4/');
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
        //variables
        describe('#variables()', function () {
            it('should return an instance of the variables service', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                var vs = rs.variables();

                //FIXME: This currently returns an object
                // vs.should.be.instanceOf(VariableService);
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
                        // console.log('Ops do success');
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
