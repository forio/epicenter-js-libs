
import ScenarioManager from '../index';
import RunManager from 'managers/run-manager';
import SavedRunsManager from '../saved-runs-manager';

import RunService from 'service/run-api-service';

import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;
var baseStateURL = (new URLService()).getAPIPath('model/state');

var runOptions = {
    model: 'model.eqn',
    account: 'forio-dev',
    id: 'good',
    project: 'js-libs'
};
var baseRunURL = (new URLService({ accountPath: runOptions.account, projectPath: runOptions.project })).getAPIPath('run');

var sampleSession = {
    auth_token: '',
    account: 'forio-dev-cookie',
    project: 'js-libs-cookie',
    userId: '123',
    groupId: 'group123',
    groupName: 'group-123',
    isFac: false
};

describe('Scenario Manager', function () {
    var server;
    beforeEach(function () {
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

        server.respondWith('POST', /(.*)\/state\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ run: 'clonedrun' }));
        });
            
        server.respondWith('GET', /(.*)\/run\/([^/]*)\/([^/]*)\/(.*)/, function (xhr, base, account, project, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ 
                id: id.replace('/', ''),
                account: account,
                project: project,
            }));
            return true;
        });
        server.respondImmediately = true;
    });

    afterEach(function () {
        server.restore();
    });


    describe('Options', function () {
        describe('#includeBaseLine', function () {
            it('should not create baseline if set', function () {
                var rs = new RunService(runOptions);
                var createStub = sinon.stub(rs, 'create');
                var queryStub = sinon.stub(rs, 'query');
                var sm = new ScenarioManager({ run: rs, includeBaseLine: false });
                return sm.baseline.getRun().then(function (run) {
                    expect(createStub).to.not.have.been.called;
                    expect(queryStub).to.not.have.been.called;
                });
            });
            it('should still get saved runs', function () {
                var rs = new RunService(runOptions);
                var sm = new ScenarioManager({ run: rs, includeBaseLine: false });
                var getRunsStub = sinon.stub(sm.savedRuns, 'getRuns').returns($.Deferred().resolve([]).promise());
                return sm.savedRuns.getRuns().then(function () {
                    expect(getRunsStub).to.have.been.calledOnce;
                });
            });
        });
    });
    describe('baseline', function () {
        it('should create a new baseline run manager', function () {
            var sm = new ScenarioManager({ run: runOptions });
            expect(sm.baseline).to.be.instanceof(RunManager);
        });
        it('should pass through the right options', function () {
            var sm = new ScenarioManager({ run: runOptions });
            sinon.stub(sm.baseline.sessionManager, 'getSession').returns(sampleSession);

            return sm.baseline.getRun().then(function (run) {
                var config = sm.baseline.run.getCurrentConfig();
                expect(config.account).to.equal(runOptions.account);
                expect(config.project).to.equal(runOptions.project);
            });
        });
        it('should merge baseline options', function () {
            var sm = new ScenarioManager({ run: runOptions, baseline: { run: { account: 'batman' } } });
            var config = sm.baseline.run.getCurrentConfig();
            expect(config.account).to.equal('batman');
            expect(config.project).to.equal('js-libs');
        });
        describe('getRun', function () {
            it('should query for the right baseline filter', ()=> {
                var rs = new RunService(runOptions);
                var sampleBaseline = {
                    id: 'run1',
                    name: 'baseline',
                    saved: true
                };
                const querySpy = sinon.spy(()=> $.Deferred().resolve([
                    sampleBaseline
                ]).promise());
                sinon.stub(rs, 'query').callsFake(querySpy);
                var sm = new ScenarioManager({ run: rs });
                return sm.baseline.getRun().then(function (run) {
                    expect(querySpy).to.have.been.calledOnce;
                    const args = querySpy.getCall(0).args[0];
                    expect(args).to.eql({
                        model: runOptions.model,
                        saved: true,
                        trashed: false,
                        name: 'Baseline',
                        isBaseline: true,
                    });
                });
            });
            it('should return existing runs if it finds one', function () {
                var rs = new RunService(runOptions);
                var sampleBaseline = {
                    id: 'run1',
                    name: 'baseline',
                    saved: true
                };
                sinon.stub(rs, 'query').returns($.Deferred().resolve([
                    sampleBaseline
                ]).promise());
                var sm = new ScenarioManager({ run: rs });
                return sm.baseline.getRun().then(function (run) {
                    expect(run).to.eql(sampleBaseline);
                });
            });
            it('should create & step if no existing runs found', function () {
                var rs = new RunService(runOptions);
                sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                var sm = new ScenarioManager({ run: rs });
                var createStub = sinon.stub(sm.baseline.run, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());
                var serialStub = sinon.stub(sm.baseline.run, 'serial').returns($.Deferred().resolve([]).promise());
                return sm.baseline.getRun().then(function (run) {
                    expect(createStub).to.have.been.calledOnce;
                    expect(serialStub).to.have.been.calledOnce;
                    expect(serialStub).to.have.been.calledWith([{ name: 'stepTo', params: ['end'] }]);
                });
            });
            it('should allow changing the initial operation', function () {
                var rs = new RunService(runOptions);
                sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                var sm = new ScenarioManager({ 
                    run: rs,
                    advanceOperation: [{ foo: 'bar' }]
                });
                sinon.stub(sm.baseline.run, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());
                var serialStub = sinon.stub(sm.baseline.run, 'serial').returns($.Deferred().resolve([]).promise());
                return sm.baseline.getRun().then(function (run) {
                    expect(serialStub).to.have.been.calledWith([{ foo: 'bar' }]);
                });
            });
            it('should mark as saved', function () {
                var rs = new RunService(runOptions);
                sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                var sm = new ScenarioManager({ 
                    run: rs,
                    baseline: {
                        runName: 'batman'
                    }
                });
                sinon.stub(sm.baseline.run, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());
                sinon.stub(sm.baseline.run, 'serial').returns($.Deferred().resolve([]).promise());
                var saveStub = sinon.stub(sm.baseline.run, 'save').returns($.Deferred().resolve([]).promise());
                return sm.baseline.getRun().then(function (run) {
                    expect(saveStub).to.have.been.calledOnce;
                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({
                        name: 'batman',
                        saved: true,
                        trashed: false,
                        isBaseline: true,
                    });
                });
            });
            describe('Scope', ()=> {
                it('should scope by user by default', ()=> {
                    var rs = new RunService(runOptions);
                    const queryStub = sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                    var sm = new ScenarioManager({ 
                        run: rs,
                        baseline: {
                            runName: 'batman',
                        }
                    });
                    sinon.stub(sm.baseline.sessionManager, 'getSession').returns(sampleSession);

                    sinon.stub(sm.baseline.run, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());
                    sinon.stub(sm.baseline.run, 'serial').returns($.Deferred().resolve([]).promise());
                    sinon.stub(sm.baseline.run, 'save').returns($.Deferred().resolve([]).promise());
                    return sm.baseline.getRun().then(function (run) {
                        expect(queryStub).to.have.been.calledOnce;
                        var args = queryStub.getCall(0).args;
                        expect(args[0]['user.id']).to.eql(sampleSession.userId);
                    });
                });

                it('should allow to not scope by user', ()=> {
                    var rs = new RunService(runOptions);
                    const queryStub = sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                    var sm = new ScenarioManager({ 
                        run: rs,
                        baseline: {
                            runName: 'batman',
                            scope: {
                                scopeByUser: false,
                            }
                        }
                    });
                    sinon.stub(sm.baseline.sessionManager, 'getSession').returns(sampleSession);

                    sinon.stub(sm.baseline.run, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());
                    sinon.stub(sm.baseline.run, 'serial').returns($.Deferred().resolve([]).promise());
                    sinon.stub(sm.baseline.run, 'save').returns($.Deferred().resolve([]).promise());
                    return sm.baseline.getRun().then(function (run) {
                        expect(queryStub).to.have.been.calledOnce;
                        var args = queryStub.getCall(0).args;
                        expect(args[0]['user.id']).to.not.exist;
                    });
                });
            });
           
        });
    });
    describe('current run', function () {
        it('should create a new current run manager', function () {
            var sm = new ScenarioManager({ run: runOptions });
            expect(sm.current).to.be.instanceof(RunManager);
        });
        it('should merge current run options', function () {
            var sm = new ScenarioManager({ run: runOptions, current: { run: { account: 'batman' } } });
            var config = sm.current.run.getCurrentConfig();
            expect(config.account).to.equal('batman');
            expect(config.project).to.equal('js-libs');
        });
        it('should pass through the right options', function () {
            var sm = new ScenarioManager({ run: runOptions });
            sinon.stub(sm.current.sessionManager, 'getSession').returns(sampleSession);

            return sm.current.getRun().then(function (run) {
                var config = sm.current.run.getCurrentConfig();
                expect(config.account).to.equal(runOptions.account);
                expect(config.project).to.equal(runOptions.project);
            });
        });
        describe('#getRun', function () {
            it('should query for current runs', ()=> {
                var rs = new RunService(runOptions);
                var sampleRun = {
                    id: 'run1',
                    name: 'food',
                    saved: false
                };
                const querySpy = sinon.spy(()=> $.Deferred().resolve([
                    sampleRun
                ]).promise());
                sinon.stub(rs, 'query').callsFake(querySpy);
                var sm = new ScenarioManager({ run: rs });
                return sm.current.getRun().then(function (run) {
                    const args = querySpy.getCall(0).args[0];
                    expect(args).to.eql({
                        trashed: false,
                        scope: {
                            trackingKey: 'current'
                        },
                        model: runOptions.model,
                    });
                });
            });
            it('should suffix trackingKey with current if run already has one', ()=> {
                var rs = new RunService($.extend(true, {}, runOptions, { scope: { trackingKey: 'mykey' } }));
                const querySpy = sinon.spy(()=> $.Deferred().resolve([]).promise());
                const createSpy = sinon.spy(()=> $.Deferred().resolve([]).promise());
                sinon.stub(rs, 'query').callsFake(querySpy);
                sinon.stub(rs, 'create').callsFake(createSpy);
                var sm = new ScenarioManager({ run: rs });
                return sm.current.getRun().then(function (run) {
                    const queryArgs = querySpy.getCall(0).args[0];
                    expect(queryArgs).to.eql({
                        trashed: false,
                        scope: {
                            trackingKey: 'mykey-current'
                        },
                        model: runOptions.model,
                    });

                    const createArgs = createSpy.getCall(0).args[0];
                    expect(createArgs.model).to.eql(runOptions.model);
                    expect(createArgs.scope).to.eql({
                        trackingKey: 'mykey-current'
                    });
                });
            });
            it('should return last tracked run if found', function () {
                var rs = new RunService(runOptions);
                var sampleRun = {
                    id: 'run1',
                    name: 'food',
                };
                sinon.stub(rs, 'query').returns($.Deferred().resolve([
                    sampleRun
                ]).promise());
                var sm = new ScenarioManager({ run: rs });
                return sm.current.getRun().then(function (run) {
                    expect(run).to.eql(sampleRun);
                });
            });
            it('should create a new run if no runs are found', function () {
                var rs = new RunService(runOptions);
                sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                const createSpy = sinon.spy(()=> $.Deferred().resolve({ id: 'foo' }).promise());
                var createStub = sinon.stub(rs, 'create').callsFake(createSpy);
                var sm = new ScenarioManager({ run: rs });
                return sm.current.getRun().then(function (run) {
                    expect(createStub).to.have.been.calledOnce;

                    const args = createSpy.getCall(0).args[0];
                    expect(args.model).to.eql(runOptions.model);
                    expect(args.scope.trackingKey).to.eql('current');
                });
            });
            
        });
        describe('#saveAndAdvance', function () {
            var rs, sm, saveStub;
            beforeEach(function () {
                rs = new RunService(runOptions);
                sm = new ScenarioManager({ 
                    run: rs,
                    advanceOperation: [{ myadvance: 'opn' }]
                });
                sinon.stub(sm.current, 'getRun').returns($.Deferred().resolve({ id: 'currentrun' }).promise());
                saveStub = sinon.stub(sm.savedRuns, 'save').callsFake(function (runid, patchData) {
                    var toReturn = $.extend(true, {}, { id: runid }, patchData, { saved: true });
                    return $.Deferred().resolve(toReturn).promise();
                });
            });
            it('execute the right sequence of operations', function () {
                return sm.current.saveAndAdvance().then(function (newrun) {
                    var cloneRequest = server.requests.shift();
                    cloneRequest.method.toUpperCase().should.equal('POST');
                    cloneRequest.url.should.equal(baseStateURL + 'currentrun');
                        
                    var loadRequest = server.requests.shift();
                    loadRequest.method.toUpperCase().should.equal('GET');
                    loadRequest.url.should.equal(baseRunURL + 'clonedrun/');

                    var operationRequest = server.requests.shift();
                    operationRequest.method.toUpperCase().should.equal('POST');
                    operationRequest.url.should.equal(baseRunURL + 'clonedrun/operations/myadvance/');

                    expect(saveStub).to.have.been.calledOnce;
                    var saveArgs = saveStub.getCall(0).args;
                    expect(saveArgs[0]).to.eql('clonedrun');
                });
            });
            it('should exclude operations from clone', function () {
                return sm.current.saveAndAdvance().then(function (newrun) {
                    var cloneRequest = server.requests.shift();
                    cloneRequest.url.should.equal(baseStateURL + 'currentrun');

                    var posted = JSON.parse(cloneRequest.requestBody);
                    expect(posted.exclude).to.eql(['myadvance']);
                });
            });
            it('should return the right output', function () {
                return sm.current.saveAndAdvance().then(function (newrun) {
                    expect(newrun).to.eql({ id: 'clonedrun', account: runOptions.account, project: runOptions.project, saved: true });
                });
            });
            it('should save metadata', function () {
                return sm.current.saveAndAdvance({ name: 'bar' }).then(function (newrun) {
                    var saveArgs = saveStub.getCall(0).args;
                    expect(saveArgs[1]).to.eql({ name: 'bar' });
                    expect(newrun).to.eql({ id: 'clonedrun', account: runOptions.account, project: runOptions.project, name: 'bar', saved: true });
                });
            });
            it('should not affect current run instance', function () {
                return sm.current.saveAndAdvance({ name: 'bar' }).then(function (newrun) {
                    var config = sm.current.run.getCurrentConfig();
                    expect(config.id).to.eql('good');
                });
            });
        });
        describe('#reset', function () {
            it('should pass through options to rs:create', function () {
                var rs = new RunService(runOptions);
                var sm = new ScenarioManager({ run: rs });
                var createStub = sinon.stub(rs, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());

                var options = { sucess: sinon.spy() };
                return sm.current.reset(options).then(function () {
                    var args = createStub.getCall(0).args;
                    expect(args[0].model).to.eql(runOptions.model);
                    expect(args[1]).to.eql(options);
                });
            });
        });
    });
    describe('saved runs', function () {
        it('should create a new saved run manager', function () {
            var sm = new ScenarioManager({ run: runOptions });
            expect(sm.savedRuns).to.be.instanceof(SavedRunsManager);
        });
        it('should wait till baseline is done before creating a new run', function () {
            var sm = new ScenarioManager({ run: runOptions });
            var getBaselineStub = sinon.stub(sm.baseline, 'getRun').returns($.Deferred().resolve({ id: 3 }).promise());
            return sm.savedRuns.getRuns().then(function () {
                expect(getBaselineStub).to.have.been.calledOnce;
            });
        });
    });
});
