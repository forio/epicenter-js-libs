import RunService from '../index';
import VariablesService from '../variables-api-service';
import URLService from 'service/url-config-service';

import { omit } from 'lodash';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

var account = 'forio';
var project = 'js-libs';

var baseURL = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('run');

var createLargeInclude = function () {
    var variables = ['sample_int', 'sample_string', 'sample_obj', 'sample_long', 'sample_float', 'sample_array'];
    var include = [];
    for (var i = 0; i < 100; i++) {
        include = include.concat(variables);
    }
    return include;
};

describe('Run API Service', function () {
    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith('PATCH', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
        });

        server.respondWith('POST', /(.*)\/run\/[^/]*\/[^/]*\/$/, function (xhr, id) {
            var resp = {
                id: '065dfe50-d29d-4b55-a0fd-30868d7dd26c',
                model: 'model.vmf',
                account: 'mit',
                project: 'afv',
                saved: false,
                lastModified: '2014-06-20T04:09:45.738Z',
                created: '2014-06-20T04:09:45.738Z'
            };
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(resp));
        });
        server.respondWith('POST', /(.*)\/run\/[^/]*\/[^/]*\/[^/]*\/operations\/(.*)\//,
            function (xhr, prefix, operation) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                    name: operation, result: operation
                }));
            });

        server.respondWith('DELETE', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            return true;
        });

        // General GET
        server.respondWith('GET', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            return true;
        });

        // General Multiple Runs GET
        server.respondWith('GET', /(.*)\/run\/(.*)\?.*include=[^&]*multiple_variables.*/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify([]));
            return true;
        });

        var run = {
            id: '065dfe50-d29d-4b55-a0fd-30868d7dd26c',
            model: 'model.vmf',
            account: account,
            project: 'js-libs',
            saved: false,
            lastModified: '2014-06-20T04:09:45.738Z',
            created: '2014-06-20T04:09:45.738Z'
        };
            // return a run, with variables A and B
        var singleVarAB = Object.assign({}, run, {
            variables: {
                varA: 9999.99,
                varB: 'A string',
            }
        });
        server.respondWith('GET', /(.*)\/run\/(.*)\?.*include=[^&]*single_variables_a_b.*/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(singleVarAB));
            return true;
        });

        // return a run, with variables C and D
        var singleVarCD = Object.assign({}, run, {
            variables: {
                varC: 'Another string',
                varD: 10.22,
            }
        });
        server.respondWith('GET', /(.*)\/run\/(.*)\?.*include=[^&]*single_variables_c_d.*/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(singleVarCD));
            return true;
        });

        // return multiple runs with variables A and B
        var multipleVarAB = [
            {
                id: 'run1',
                variables: {
                    varA: 1111.11,
                    varB: 'A string for run1',
                }
            },
            {
                id: 'run2',
                variables: {
                    varA: 2222.22,
                    varB: 'A string for run2',
                }
            },
        ];
        server.respondWith('GET', /(.*)\/run\/(.*)\?.*include=[^&]*multiple_variables_a_b.*/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(multipleVarAB));
            return true;
        });

        // return multiple runs with variables C and D
        var multipleVarBD = [
            {
                id: 'run1',
                variables: {
                    varC: 'Another string for run1',
                    varD: '2015-11-16 10:10:10'
                }
            },
            {
                id: 'run2',
                variables: {
                    varC: 'Another string for run2',
                    varD: '2015-11-16 20:20:20'
                }
            },
        ];
        server.respondWith('GET', /(.*)\/run\/(.*)\?.*include=[^&]*multiple_variables_c_d.*/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(multipleVarBD));
            return true;
        });

        // Make this request fail
        // return multiple runs with variables C and D
        server.respondWith('GET', /(.*)\/run\/(.*)\?.*include=[^&]*internal_server_error.*/, function (xhr, id) {
            xhr.respond(500, { 'Content-Type': 'application/json' }, JSON.stringify({ message: 'Internal server error' }));
            return true;
        });
        server.respondImmediately = true;
    });

    beforeEach(function () {
        server.requests = [];
    });
    after(function () {
        server.restore();
    });

    it('should pass through string tokens', function () {
        var rs = new RunService({ account: account, project: 'js-libs', token: 'abc' });
        rs.create('model.jl');

        var req = server.requests.pop();
        req.requestHeaders.Authorization.should.equal('Bearer abc');

        var rs2 = new RunService({ account: account, project: project, token: '' });
        rs2.create('model.jl');

        req = server.requests.pop();
        expect(req.requestHeaders.Authorization).to.not.exist;
    });

    it('should allow specifying `id` instead of filter', function () {
        var rs = new RunService({ account: account, project: 'js-libs', id: 'abc' });
        rs.do('stuff');

        var req = server.requests.pop();
        req.url.should.equal(baseURL + 'abc/operations/stuff/');
    });

    it('should return promiseables', function () {
        var callback = sinon.spy();
        var rs = new RunService({ account: account, project: project });
        return rs
            .create('model.jl')
            .then(callback)
            .then(function () {
                callback.should.have.been.called;
                callback.should.have.been.calledWith({
                    id: '065dfe50-d29d-4b55-a0fd-30868d7dd26c',
                    model: 'model.vmf',
                    account: 'mit',
                    project: 'afv',
                    saved: false,
                    lastModified: '2014-06-20T04:09:45.738Z',
                    created: '2014-06-20T04:09:45.738Z'
                });
            });
        // callback.should.have.been.calledOn(rs);
    });

    describe('transport.options', function () {
        it('should pass in transport options to the underlying ajax handler', function () {
            var beforeSend = sinon.spy();
            var complete = sinon.spy();
            var rs = new RunService({ account: account, project: 'js-libs', transport: { beforeSend: beforeSend, complete: complete } });
            rs.create('model.jl');

            beforeSend.should.have.been.called;
            complete.should.have.been.called;
        });

        it('should allow over-riding transport options', function () {
            var originalComplete = sinon.spy();
            var complete = sinon.spy();
            var rs = new RunService({ account: account, project: 'js-libs', transport: { complete: originalComplete } });
            rs.create('model.jl', { complete: complete });

            originalComplete.should.not.have.been.called;
            complete.should.have.been.called;
        });

        it('should respect sequence of success handlers', function () {
            var originalSuccess = sinon.spy();
            var transportSuccess = sinon.spy();
            var rs = new RunService({ account: account, project: 'js-libs', success: originalSuccess, transport: { complete: transportSuccess } });
            rs.create('model.jl');

            originalSuccess.should.have.been.called;
            transportSuccess.should.have.been.called;
        });
    });


    describe('#create()', function () {
        it('should do a POST', function () {
            var rs = new RunService({ account: account, project: project });
            rs.create('model.jl');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('POST');

        });
        it('should POST to the base URL', function () {
            var rs = new RunService({ account: account, project: project });
            rs.create('model.jl');

            var req = server.requests.pop();
            req.url.should.equal(baseURL + '');
            req.requestBody.should.equal(JSON.stringify({ model: 'model.jl' }));

        });

        it('should take in white-listed params and passes them to the api', function () {
            var params = { model: 'model.jl', scope: { group: 'x' } };

            var rs = new RunService({ account: account, project: project });
            rs.create(params);

            var req = server.requests.pop();
            req.url.should.equal(baseURL + '');
            req.requestBody.should.equal(JSON.stringify(params));

        });

        it('should not pass in params which are not whitelisted', function () {
            var params = { model: 'model.jl', files: 'file', scope: { groupName: 'name' }, user: 'user1' };

            var rs = new RunService({ account: account, project: project });
            rs.create(params);

            var req = server.requests.pop();
            req.url.should.equal(baseURL + '');
            req.requestBody.should.equal(JSON.stringify(omit(params, ['user'])));
        });

    });

    describe('#introspect', function () {
        it('should throw an error if no options are given, and no runid available', function () {
            var rs = new RunService({ account: account, project: project });
            expect(function () { rs.introspect(); }).to.throw(Error);
        });
        it('should use existing runid if available', function () {
            var rs = new RunService({ account: account, project: project, id: 'abc' });
            expect(function () { rs.introspect(); }).to.not.throw(Error);
        });
    });

    describe('#query()', function () {
        it('should do a GET', function () {
            var rs = new RunService({ account: account, project: project });
            rs.query({ saved: true, '.price': '>1' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
        });
        it('should convert filters to matrix parameters', function () {
            var rs = new RunService({ account: account, project: project });
            rs.query({ saved: true, '.price': '1' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + ';saved=true;.price=1/');
        });

        it('should take matrix params with arithmetic operators', function () {
            var rs = new RunService({ account: account, project: project });
            rs.query({ a: '<1', b: '>1', c: '!=1', d: '>=1', e: '<=1' }, { include: 'score' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + ';a<1;b>1;c!=1;d>=1;e<=1/?include=score');
        });

        it('should be idempotent across multiple queries', function () {
            var rs = new RunService({ account: account, project: project });
            return rs.query({ saved: true, '.price': '>1' }).then(function () {
                return rs.query({ saved: false, '.sales': '<4' }).then(function () {
                    server.requests[0].url.should.equal(baseURL + ';saved=true;.price>1/');
                    server.requests[1].url.should.equal(baseURL + ';saved=false;.sales<4/');
                });
            });
        });
        it('should convert op modifiers to query strings', function () {
            var rs = new RunService({ account: account, project: project });
            rs.query({}, { page: 1, limit: 2 });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + ';/?page=1&limit=2');
        });
        it('should split the get in multiple GETs', function () {
            var rs = new RunService({ account: account, project: project });
            var include = createLargeInclude();

            rs.query({}, { include: include });
            server.respond();
            server.requests.length.should.be.above(1);
            server.requests.forEach(function (xhr) {
                xhr.url.length.should.be.below(2049);
            });
        });
        it('should fail if one or more of the multiple GETs fail', function () {
            var success = sinon.spy();
            var fail = sinon.spy();
            var rs = new RunService({ account: account, project: project });
            var include = createLargeInclude();
            include.push('internal_server_error');

            return rs.query({}, { include: include }).then(success, fail).then(function () {
                fail.should.have.been.called;
                success.should.not.have.been.called;
            });
        });
        it('should aggregate the response from the multiple GETs for a single run', function () {
            var success = sinon.spy();
            var fail = sinon.spy();
            var rs = new RunService({ account: account, project: project });
            var include = createLargeInclude();
            include.push('single_variables_c_d');
            include = ['single_variables_a_b'].concat(include);

            return rs.query({}, { include: include }).then(success, fail).then(function () {
                success.should.have.been.calledWith({
                    id: '065dfe50-d29d-4b55-a0fd-30868d7dd26c',
                    model: 'model.vmf',
                    account: account,
                    project: 'js-libs',
                    saved: false,
                    lastModified: '2014-06-20T04:09:45.738Z',
                    created: '2014-06-20T04:09:45.738Z',
                    variables: {
                        varA: 9999.99,
                        varB: 'A string',
                        varC: 'Another string',
                        varD: 10.22,
                    }
                });
                fail.should.not.have.been.called;
            });
        });
        it('should aggregate the reponse from the multiple GETs for a multiple runs', function () {
            var success = sinon.spy();
            var fail = sinon.spy();
            var rs = new RunService({ account: account, project: project });
            var include = createLargeInclude();
            include.push('multiple_variables_c_d');
            include = ['multiple_variables_a_b'].concat(include);

            return rs.query({}, { include: include }).then(success, fail).then(function () {
                success.should.have.been.calledWith([
                    {
                        id: 'run1',
                        variables: {
                            varA: 1111.11,
                            varB: 'A string for run1',
                            varC: 'Another string for run1',
                            varD: '2015-11-16 10:10:10'
                        }
                    },
                    {
                        id: 'run2',
                        variables: {
                            varA: 2222.22,
                            varB: 'A string for run2',
                            varC: 'Another string for run2',
                            varD: '2015-11-16 20:20:20'
                        }
                    },
                ]);
                fail.should.not.have.been.called;
            });
        });
    });

    describe('#filter', function () {
        it('should do a GET', function () {
            var rs = new RunService({ account: account, project: project });
            rs.filter({ saved: true, '.price': '>1' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
        });
        it('should convert filters to matrix parameters', function () {
            var rs = new RunService({ account: account, project: project });
            rs.filter({ saved: true, '.price': '1' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + ';saved=true;.price=1/');
        });
        it('should convert op modifiers to query strings', function () {
            var rs = new RunService({ account: account, project: project });
            rs.filter({}, { page: 1, limit: 2 });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + ';/?page=1&limit=2');
        });
        it('should pass through options across multiple queries', function () {

            var rs = new RunService({ account: account, project: project });
            rs.filter({ saved: true, '.price': '>1' });

            server.requests[0].url.should.equal(baseURL + ';saved=true;.price>1/');


            rs.filter({ saved: false, '.sales': '<4' });

            server.requests[1].url.should.equal(baseURL + ';saved=false;.price>1;.sales<4/');

        });
        it('should not include the AutoRestore header', function () {
            var rs = new RunService({ account: account, project: project });
            rs.filter({ saved: true, '.price': '1' });

            var req = server.requests.pop();
            req.requestHeaders.should.not.have.property('X-AutoRestore');
        });
        it('should include the AutoRestore header', function () {
            var rs = new RunService({ account: account, project: project });
            rs.filter('myfancyrunid');

            var req = server.requests.pop();
            req.requestHeaders['X-AutoRestore'].should.equal('true');
        });
        it('should not include the AutoRestore header with autoRestore: false', function () {
            var rs = new RunService({ account: account, project: 'js-libs', autoRestore: false });
            rs.filter('myfancyrunid');

            var req = server.requests.pop();
            req.requestHeaders.should.not.have.property('X-AutoRestore');
        });
    });
    describe('#load()', function () {
        it('should do an GET', function () {
            var rs = new RunService({ account: account, project: project });
            rs.load('myfancyrunid', { include: 'score' });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
        });

        it('should take in a run id and query the server', function () {
            var rs = new RunService({ account: account, project: project });
            rs.load('myfancyrunid', { include: 'score' });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'myfancyrunid/?include=score');
        });
        it('should load a run without any filters', function () {
            var rs = new RunService({ account: account, project: project });
            rs.load('myfancyrunid', null);

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'myfancyrunid/');
        });
        it('should use the service options filter if none provided', function () {
            var rs = new RunService({ account: account, project: 'js-libs', filter: 'myfancyrunid' });
            rs.load();

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'myfancyrunid/');
        });
        it('should add the autorestore run flag', function () {
            var rs = new RunService({ account: account, project: project });
            rs.load('myfancyrunid', null);

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'myfancyrunid/');
            req.requestHeaders['X-AutoRestore'].should.equal('true');
        });
    });
    describe('#removeFromMemory', function () {
        it('should make a delete call with the run id', function () {
            var rs = new RunService({ account: account, project: project });
            return rs.removeFromMemory('myfancyrunid').then(function () {
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'myfancyrunid');
                req.method.toLowerCase().should.equal('delete');
            });
        });
        it('should pick up run id from service options if provided', function () {
            var rs = new RunService({ account: account, project: project, id: 'myfancyrunid' });
            return rs.removeFromMemory().then(function () {
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'myfancyrunid/');
                req.method.toLowerCase().should.equal('delete');
            });
        });
    });

    describe('#save()', function () {
        it('should require a filter', function () {
            var rs = new RunService({ account: account, project: project });
            var ret = function () { rs.save({ completed: true }); };
            ret.should.throw(Error);
        });
        it('should allow passing in filter through options', function () {
            var rs = new RunService({ account: account, project: project });
            rs.save({ completed: true }, { filter: { saved: true } });

            var req = server.requests.pop();
            req.url.should.equal(baseURL + ';saved=true/');
        });

        it('should do an PATCH', function () {
            var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
            rs.save({ completed: true });

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('PATCH');
        });

        it('should take in options and send to server', function () {
            var params = { completed: true };
            var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
            rs.save(params);

            var req = server.requests.pop();
            req.url.should.equal(baseURL + ';saved=true/');
            req.requestBody.should.equal(JSON.stringify(params));

        });
    });
    //variables
    describe('#variables()', function () {
        it('should return an instance of the variables service', function () {
            var rs = new RunService({ account: account, project: project });
            var vs = rs.variables();

            vs.should.be.instanceof(VariablesService);
        });

    });

    //Operations
    describe('Run#Operations', function () {
        describe('#do', function () {
            it('should require a filter', function () {
                var rs = new RunService({ account: account, project: project });
                var ret = function () { rs.do('solve'); };
                ret.should.throw(Error);
            });

            it('should do a POST', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                rs.do('add', [1, 2]);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });
            it('should take in operation names and send to server', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                rs.do('add', [1, 2]);

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';saved=true/operations/add/');
                req.requestBody.should.equal(JSON.stringify({ arguments: [1, 2] }));
            });

            it('should take in operation names  with single values and send to server', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                rs.do('echo', 'hello');

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';saved=true/operations/echo/');
                req.requestBody.should.equal(JSON.stringify({ arguments: ['hello'] }));
            });

            it('should send operations without any parameters', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                rs.do('init');

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';saved=true/operations/init/');
                req.requestBody.should.equal(JSON.stringify({ arguments: [] }));
            });
        });

        describe('#serial', function () {
            it('should require a filter', function () {
                var rs = new RunService({ account: account, project: project });
                var ret = function () { rs.serial(['init', 'solve']); };
                ret.should.throw(Error);
            });

            it('should send multiple operations calls one by one', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                return rs.serial([{ first: [1, 2] }, { second: [2, 3] }]).then(function () {
                    server.requests.length.should.equal(2);
                    server.requests[0].url.should.equal(baseURL + ';saved=true/operations/first/');
                    server.requests[0].requestBody.should.equal(JSON.stringify({ arguments: [1, 2] }));

                    server.requests[1].url.should.equal(baseURL + ';saved=true/operations/second/');
                    server.requests[1].requestBody.should.equal(JSON.stringify({ arguments: [2, 3] }));
                });
            });

            it('should send operations without any parameters', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                rs.serial(['init']);

                var req = server.requests.pop();
                req.url.should.equal(baseURL + ';saved=true/operations/init/');
                req.requestBody.should.equal(JSON.stringify({ arguments: [] }));
            });

            it('should call success function with all responses', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                var spy = sinon.spy();
                return rs.serial(['init', 'foo']).then(spy).then(function () {
                    spy.should.have.been.calledOnce;
                    spy.should.have.been.calledWith([{ name: 'init', result: 'init' }, { name: 'foo', result: 'foo' }]);
                });
            });
        });

        describe('#parallel', function () {
            it('should require a filter', function () {
                var rs = new RunService({ account: account, project: project });
                var ret = function () { rs.parallel(['init', 'solve']); };
                ret.should.throw(Error);
            });

            it('should send multiple operations calls once by one', function () {

                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                rs.parallel([{ first: [1, 2] }, { second: [2, 3] }]);

                server.requests.length.should.equal(2);
            });
            it('should call success function with all responses', function () {
                var rs = new RunService({ account: account, project: 'js-libs', filter: { saved: true } });
                var spy = sinon.spy();
                return rs.parallel(['init', 'foo']).then(spy).then(function () {
                    spy.should.have.been.calledOnce;
                    spy.should.have.been.calledWith([{ name: 'init', result: 'init' }, { name: 'foo', result: 'foo' }]);
                });
            });
        });
    });
    describe('#getCurrentConfig', function () {
        it('should return the current service options', function () {
            var rs = new RunService({ account: account, project: project });
            var conf = rs.getCurrentConfig();

            conf.account.should.equal(account);
            conf.project.should.equal(project);
        });
        it('should update config after creation', function () {
            var rs = new RunService({ account: account, project: project });
            var conf = rs.getCurrentConfig();
            conf.id.should.equal('');

            return rs.create().then(function () {
                var newConf = rs.getCurrentConfig();
                newConf.filter.should.equal('065dfe50-d29d-4b55-a0fd-30868d7dd26c');
                newConf.id.should.equal('065dfe50-d29d-4b55-a0fd-30868d7dd26c');
            });
        });
    });
    describe('#updateConfig', function () {
        it('should update service options', function () {
            var oldUrl = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('run');
            var rs = new RunService({ account: account, project: project });
                
            return rs.create().then(function () {
                var req = server.requests.pop();
                req.url.should.equal(oldUrl);

                rs.updateConfig({ account: 'abcd' });
                var newUrl = (new URLService({ accountPath: 'abcd', projectPath: project })).getAPIPath('run');

                return rs.create().then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(newUrl);
                });
            });
        });

        it('should update filter/id given either', function () {
            var rs = new RunService({ account: account, project: project, id: 'foo' });
            return rs.load().then(function () {
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'foo/');
                rs.updateConfig({ filter: 'bar' });
                return rs.load().then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'bar/');
                    rs.updateConfig({ id: 'boo' });
                    return rs.load().then(function () {
                        var req = server.requests.pop();
                        req.url.should.equal(baseURL + 'boo/');
                    });
                });
            });
        });
        it('should update url for variable service', function () {
            var rs = new RunService({ account: account, project: project, id: 'foo' });
            return rs.variables().query('v1').then(function () {
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'foo/variables/?v1');
                rs.updateConfig({ filter: 'bar' });
                return rs.variables().query('v1').then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'bar/variables/?v1');
                });
            });
        });
        it('should do nothing if no options passed in', function () {
            var rs = new RunService({ account: account, project: project, id: 'foo' });
            rs.updateConfig();
            return rs.load().then(function () {
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'foo/');
            });
        });
    });
});
