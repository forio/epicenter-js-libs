(function () {
    'use strict';

    var RunService = F.service.Run;

    var account = 'forio';
    var project = 'js-libs';

    var baseURL = (new F.service.URL({ accountPath: account, projectPath: project })).getAPIPath('run');

    var createLargeInclude = function () {
        var variables = ['sample int', 'sample string', 'sample obj', 'sample long', 'sample float', 'sample array'];
        var include = [];
        for (var i = 0; i < 100; i++) {
            include = include.concat(variables);
        }
        return include;
    };

    describe('Variables Service', function () {
        var server, rs, vs;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            // General Multiple Runs GET
            server.respondWith('GET',  /(.*)\/run\/(.*)\?.*include=[^&]*sample .*/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({}));
                return true;
            });
            // return variables A and B
            var variablesAB = {
                'varA': 'Value A',
                'varB': 0.0001
            };
            server.respondWith('GET',  /(.*)\/run\/(.*)\?.*include=[^&]*variables_a_b.*/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(variablesAB));
                return true;
            });
            // return variables C and D
            var variablesCD = {
                'varC': 'Another string for run1',
                'varD': '2015-11-16 10:10:10'
            };
            server.respondWith('GET',  /(.*)\/run\/(.*)\?.*include=[^&]*variables_c_d.*/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(variablesCD));
                return true;
            });
            server.autoRespond = true;

            rs = new RunService({ account: account, project: project });
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
                req.url.should.equal(baseURL + ';/variables/price/');
            });
            it('should not add the autorestore run flag', function () {
                vs.load('price');
                server.respond();

                var req = server.requests.pop();
                req.requestHeaders.should.not.have.property('X-AutoRestore');
            });
            it('should add the autorestore header when filter is a runid', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: 'myfancyrunid' });
                var vs = rs.variables();
                vs.load('price');
                server.respond();

                var req = server.requests.pop();
                req.requestHeaders.should.have.property('X-AutoRestore', true);
            });
            it('should not add the autorestore header when autoRestore: false', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: 'myfancyrunid', autoRestore: false });
                var vs = rs.variables();
                vs.load('price');
                server.respond();

                var req = server.requests.pop();
                req.requestHeaders.should.not.have.property('X-AutoRestore');
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
                vs.query({ include: ['price', 'sales'] });
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';/variables/?include=price,sales');
            });
            it('should convert sets', function () {
                vs.query({ set: 'a' });
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';/variables/?set=a');
            });
            it('should convert sets & includes', function () {
                vs.query({ set: ['a', 'b'], include: 'price' });
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';/variables/?set=a,b&include=price');
            });
            it('should split the get in multiple GETs', function () {
                server.requests = [];
                var include = createLargeInclude();

                vs.query(include);
                server.respond();
                server.requests.length.should.be.above(1);
                server.requests.forEach(function (xhr) {
                    xhr.url.length.should.be.below(2048);
                });
                server.requests = [];
            });
            it('should aggregate the response from the multiple GETs from the variables API', function () {
                server.requests = [];
                var done = sinon.spy();
                var fail = sinon.spy();
                var rs = new RunService({ account: account, project: project });
                var include = createLargeInclude();
                include.push('variables_c_d');
                include = ['variables_a_b'].concat(include);

                rs.query({}, { include: include }).done(done).fail(fail);
                server.respond();
                done.should.have.been.calledWith({
                    'varA': 'Value A',
                    'varB': 0.0001,
                    'varC': 'Another string for run1',
                    'varD': '2015-11-16 10:10:10'
                });
                fail.should.not.have.been.called;
                server.requests = [];
            });
            it('the multiple GETs encoded urls length should not be larger than 2048', function () {
                server.requests = [];
                var rs = new RunService({ account: account, project: project });
                var include = createLargeInclude();

                rs.query({}, { include: include });
                server.requests.forEach(function (req) {
                    encodeURI(req.url).length.should.be.below(2048);
                });
                server.requests = [];
            });
            it('should not add the autorestore run flag', function () {
                vs.query({ set: ['a', 'b'], include: 'price' });
                server.respond();

                var req = server.requests.pop();
                req.requestHeaders.should.not.have.property('X-AutoRestore');
            });
            it('should add the autorestore header when filter is a runid', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: 'myfancyrunid' });
                var vs = rs.variables();
                vs.query({ set: ['a', 'b'], include: 'price' });
                server.respond();

                var req = server.requests.pop();
                req.requestHeaders.should.have.property('X-AutoRestore', true);
            });
            it('should not add the autorestore header when autoRestore: false', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: 'myfancyrunid', autoRestore: false });
                var vs = rs.variables();
                vs.query({ set: ['a', 'b'], include: 'price' });
                server.respond();

                var req = server.requests.pop();
                req.requestHeaders.should.not.have.property('X-AutoRestore');
            });
        });


        describe('#save()', function () {
            // Temporarily using PATCH to mean PUT
            // it('should do a PUT', function () {
            //     vs.save({ a: 1, b: 2 });
            //     server.respond();


            //     var req = server.requests.pop();
            //     req.method.toUpperCase().should.equal('PUT');
            // });

            it('should do a PATCH', function () {
                vs.save({ a: 1, b: 2 });
                server.respond();


                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
            });

            it('should send requests in the body', function () {
                var params = { a: 1, b: 2 };
                vs.save(params);
                server.respond();


                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';/variables/');
                req.requestBody.should.equal(JSON.stringify(params));
            });
            it('should support setting key, value syntax', function () {
                vs.save('a', 1);
                server.respond();

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';/variables/');
                req.requestBody.should.equal(JSON.stringify({ a: 1 }));
            });
        });

        // describe('#merge()', function () {
        //     it('should do a PATCH', function () {
        //         vs.merge({ a: 1, b: 2 });
        //         server.respond();

        //         var req = server.requests.pop();
        //         req.method.toUpperCase().should.equal('PATCH');
        //     });

        //     it('should send requests in the body', function () {
        //         var params = { a: 1, b: 2 };
        //         vs.merge(params);
        //         server.respond();

        //         var req = server.requests.pop();
        //         req.url.should.equal(baseURL + ';/variables/');
        //         req.requestBody.should.equal(JSON.stringify(params));
        //     });

        //     it('should support setting key, value syntax', function () {
        //         vs.merge('a', 1);
        //         server.respond();

        //         var req = server.requests.pop();
        //         req.url.should.equal(baseURL + ';/variables/');
        //         req.requestBody.should.equal(JSON.stringify({ a: 1 }));
        //     });
        // });

        describe('Callbacks', function () {
            describe('#load', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    vs.load('sales', null, { success: cb1 });

                    server.respond();
                    cb1.called.should.equal(true);
                });
            });
            describe('#query', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    vs.query({ include: ['price', 'sales'] }, null, { success: cb1 });

                    server.respond();
                    cb1.called.should.equal(true);
                });
            });
            describe('#save', function () {
                it('Passes success callbacks', function () {
                    var cb1 = sinon.spy();
                    var cb2 = sinon.spy();
                    vs.save({ a: 1, b: 2 }, { success: cb1 });
                    vs.save('a', 1, { success: cb2 });

                    server.respond();
                    cb1.called.should.equal(true);
                    cb2.called.should.equal(true);
                });
            });
            // describe('#merge', function () {
            //     it('Passes success callbacks', function () {
            //         var cb1 = sinon.spy();
            //         var cb2 = sinon.spy();
            //         vs.merge({ a: 1, b: 2 }, { success: cb1 });
            //         vs.merge('a', 1, { success: cb2 });

            //         server.respond();
            //         cb1.called.should.equal(true);
            //         cb2.called.should.equal(true);
            //     });
            // });
        });
    });
}());
