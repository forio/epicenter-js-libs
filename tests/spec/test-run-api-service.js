(function () {
    'use strict';

    var RunService = F.service.Run;
    var VariablesService = F.service.Variables;

    describe('Run API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('PATCH',  /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondWith('GET',  /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondWith('POST',  /(.*)\/run\/(.*)\/(.*)/,  function (xhr, id) {
                var resp = {
                    'id': '065dfe50-d29d-4b55-a0fd-30868d7dd26c',
                    'model': 'model.vmf',
                    'account': 'mit',
                    'project': 'afv',
                    'saved': false,
                    'lastModified': '2014-06-20T04:09:45.738Z',
                    'created': '2014-06-20T04:09:45.738Z'
                };
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(resp));
            });


            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        it('should pass through string tokens', function () {
            var rs = new RunService({ account: 'forio', project: 'js-libs', token: 'abc' });
            rs.create('model.jl');

            var req = server.requests.pop();
            req.requestHeaders.Authorization.should.equal('Bearer abc');

            var rs2 = new RunService({ account: 'forio', project: 'js-libs' });
            rs2.create('model.jl');

            req = server.requests.pop();
            should.not.exist(req.requestHeaders.Authorization);
        });

        it('should return promiseables', function () {
            var callback = sinon.spy();
            var rs = new RunService({ account: 'forio', project: 'js-libs' });
            rs
                .create('model.jl')
                .then(callback);

            server.respond();

            callback.should.have.been.called;
            callback.should.have.been.calledWith({
                    'id': '065dfe50-d29d-4b55-a0fd-30868d7dd26c',
                    'model': 'model.vmf',
                    'account': 'mit',
                    'project': 'afv',
                    'saved': false,
                    'lastModified': '2014-06-20T04:09:45.738Z',
                    'created': '2014-06-20T04:09:45.738Z'
                });
            // callback.should.have.been.calledOn(rs);

        });

        describe('transport.options', function () {
            it('should pass in transport options to the underlying ajax handler', function () {
                var beforeSend = sinon.spy();
                var complete = sinon.spy();
                var rs = new RunService({ account: 'forio', project: 'js-libs', transport: { beforeSend: beforeSend, complete: complete } });
                rs.create('model.jl');

                server.respond();
                beforeSend.should.have.been.called;
                complete.should.have.been.called;
            });

            it('should allow over-riding transport options', function () {
                var originalComplete = sinon.spy();
                var complete = sinon.spy();
                var rs = new RunService({ account: 'forio', project: 'js-libs', transport: { complete: originalComplete } });
                rs.create('model.jl', { complete: complete });

                server.respond();
                originalComplete.should.not.have.been.called;
                complete.should.have.been.called;
            });

            it('should allow over-riding transport options', function () {
                var originalComplete = sinon.spy();
                var complete = sinon.spy();
                var rs = new RunService({ account: 'forio', project: 'js-libs', transport: { complete: originalComplete } });
                rs.create('model.jl', { complete: complete });

                server.respond();
                originalComplete.should.not.have.been.called;
                complete.should.have.been.called;
            });

            it('should respect sequence of success handlers', function () {
                var originalSuccess = sinon.spy();
                var transportSuccess = sinon.spy();
                var rs = new RunService({ account: 'forio', project: 'js-libs', success: originalSuccess, transport: { complete: transportSuccess } });
                rs.create('model.jl');

                server.respond();
                originalSuccess.should.have.been.called;
                transportSuccess.should.have.been.called;
            });
        });


        describe('#create()', function () {
            it('should do a POST', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.create('model.jl');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');

            });
            it('should POST to the base URL', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.create('model.jl');

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/');
                req.requestBody.should.equal(JSON.stringify({ model: 'model.jl' }));

            });

            it('should take in white-listed params and passes them to the api', function () {
                var params = { model: 'model.jl', scope: { group: 'x' } };

                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.create(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/');
                req.requestBody.should.equal(JSON.stringify(params));

            });

            it('should not pass in params which are not whitelisted', function () {
                var params = { model: 'model.jl', files: 'file', scope: { groupName: 'name' }, user: 'user1' };

                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.create(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/');
                req.requestBody.should.equal(JSON.stringify(_.omit(params, ['user'])));
            });

        });
        describe('#query()', function () {
            it('should do a GET', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.query({ saved: true, '.price': '>1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should convert filters to matrix parameters', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.query({ saved: true, '.price': '1' });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price=1/');
            });

            it('should take matrix params with arithmetic operators', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.query({ a: '<1', b: '>1', c: '!=1', d: '>=1', e: '<=1' }, { include: 'score' });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;a<1;b>1;c!=1;d>=1;e<=1/?include=score');
            });

            it('should be idempotent across multiple queries', function () {
                server.requests = [];
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.query({ saved: true, '.price': '>1' });
                server.respond();

                server.requests[0].url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price>1/');


                rs.query({ saved: false, '.sales': '<4' });
                server.respond();

                server.requests[1].url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=false;.sales<4/');
                server.requests = [];

            });
            it('should convert op modifiers to query strings', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.query({}, { page: 1, limit:2 });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/?page=1&limit=2');
            });
        });

        describe('#filter', function () {
            it('should do a GET', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.filter({ saved: true, '.price': '>1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });
            it('should convert filters to matrix parameters', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.filter({ saved: true, '.price': '1' });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price=1/');
            });
            it('should convert op modifiers to query strings', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.filter({}, { page: 1, limit:2 });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/?page=1&limit=2');
            });
            it('should pass through options across multiple queries', function () {
                server.requests = [];

                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.filter({ saved: true, '.price': '>1' });
                server.respond();

                server.requests[0].url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price>1/');


                rs.filter({ saved: false, '.sales': '<4' });
                server.respond();

                server.requests[1].url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=false;.price>1;.sales<4/');
                server.requests = [];

            });
        });
        describe('#load()', function () {
            it('should do an GET', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.load('myfancyrunid', { include: 'score' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });

            it('should take in a run id and query the server', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.load('myfancyrunid', { include: 'score' });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/myfancyrunid/?include=score');
            });
        });

        describe('#save()', function () {
            it('should require a filter', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                var ret = function () { rs.save({ completed: true });};
                ret.should.throw(Error);
            });
            it('should allow passing in filter through options', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.save({ completed: true }, { filter: { saved:true } });

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/');
            });

            it('should do an PATCH', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved:true } });
                rs.save({ completed: true });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
            });

            it('should take in options and send to server', function () {
                var params = { completed: true };
                var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved:true } });
                rs.save(params);

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/');
                req.requestBody.should.equal(JSON.stringify(params));

            });
        });
        //variables
        describe('#variables()', function () {
            it('should return an instance of the variables service', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                var vs = rs.variables();

                vs.should.be.instanceof(VariablesService);
            });

        });

        //Operations
        describe('Run#Operations', function () {
            describe('#do', function () {
                it('should require a filter', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs' });
                    var ret = function () { rs.do('solve');};
                    ret.should.throw(Error);
                });

                it('should do a POST', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved: true } });
                    rs.do('add', [1,2]);

                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('POST');
                });
                it('should take in operation names and send to server', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved: true } });
                    rs.do('add', [1,2]);

                    var req = server.requests.pop();
                    req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/operations/add/');
                    req.requestBody.should.equal(JSON.stringify({ arguments: [1,2] }));
                });

                it('should take in operation names  with single values and send to server', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved: true } });
                    rs.do('echo', 'hello');

                    var req = server.requests.pop();
                    req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/operations/echo/');
                    req.requestBody.should.equal(JSON.stringify({ arguments: ['hello'] }));
                });

                it('should send operations without any parameters', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved: true } });
                    rs.do('init');

                    server.respond();
                    var req = server.requests.pop();
                    req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/operations/init/');
                    req.requestBody.should.equal(JSON.stringify({ arguments: [] }));
                });
            });

            describe('#serial', function () {
                it('should require a filter', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs' });
                    var ret = function () { rs.serial(['init', 'solve']);};
                    ret.should.throw(Error);
                });

                it('should send multiple operations calls once by one', function () {
                    server.requests = [];

                    var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved: true } });
                    rs.serial([{ first: [1,2] }, { second: [2,3] }]);
                    server.respond();

                    server.requests.length.should.equal(2);
                    server.requests[0].url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/operations/first/');
                    server.requests[0].requestBody.should.equal(JSON.stringify({ arguments: [1,2] }));

                    server.requests[1].url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/operations/second/');
                    server.requests[1].requestBody.should.equal(JSON.stringify({ arguments: [2,3] }));
                });

                it('should send operations without any parameters', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved: true } });
                    rs.serial(['init']);
                    server.respond();

                    var req = server.requests.pop();
                    req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true/operations/init/');
                    req.requestBody.should.equal(JSON.stringify({ arguments: [] }));
                });
            });

            describe('#parallel', function () {
                it('should require a filter', function () {
                    var rs = new RunService({ account: 'forio', project: 'js-libs' });
                    var ret = function () { rs.parallel(['init', 'solve']);};
                    ret.should.throw(Error);
                });

                it('should send multiple operations calls once by one', function () {
                    server.requests = [];

                    var rs = new RunService({ account: 'forio', project: 'js-libs', filter: { saved: true } });
                    rs.parallel([{ first: [1,2] }, { second: [2,3] }]);
                    server.respond();

                    server.requests.length.should.equal(2);
                });
            });
        });
        describe('#urlConfig', function () {
            it('should be set after #query', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.query({ saved: true, '.price': '>1' });

                rs.urlConfig.filter = ';saved=true;.price=>1';

                rs.query({ saved: false, '.sales': '<4' });
                rs.urlConfig.filter = ';saved=false;.sales=<4';
            });


            it('should be set after #load', function () {
                var rs = new RunService({ account: 'forio', project: 'js-libs' });
                rs.load('myfancyrunid', { include: 'score' });

                rs.urlConfig.filter = 'myfancyrunid';

                rs.load('myfancyrunid2', { include: 'score' });
                rs.urlConfig.filter = 'myfancyrunid2';
            });
        });
    });
})();
