(function () {
    'use strict';

    var ScenarioManager = F.manager.ScenarioManager;
    var RunManager = F.manager.RunManager;
    var SavedRunsManager = F.manager.SavedRunsManager;

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        id: 'good',
        project: 'js-libs'
    };

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

            server.respondWith('POST', /(.*)\/run\/[^\/]*\/[^\/]*\/$/, function (xhr, id) {
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
            server.respondWith('POST', /(.*)\/run\/[^\/]*\/[^\/]*\/[^\/]*\/operations\/(.*)\//,
                function (xhr, prefix, operation) {
                    xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                        name: operation, result: operation
                    }));
                });

            server.respondWith('POST', /(.*)\/state\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ run: 'foo' }));
            });
            
            server.respondWith('GET', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
                return true;
            });
            server.respondImmediately = true;
        });

        afterEach(function () {
            server.restore();
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
                it('should return existing runs if it finds one', function () {
                    var rs = new F.service.Run(runOptions);
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
                    var rs = new F.service.Run(runOptions);
                    sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                    var sm = new ScenarioManager({ run: rs });
                    var createStub = sinon.stub(sm.baseline.run, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());
                    var serialStub = sinon.stub(sm.baseline.run, 'serial').returns($.Deferred().resolve([]).promise());
                    return sm.baseline.getRun().then(function (run) {
                        expect(createStub).to.have.been.calledOnce;
                        expect(serialStub).to.have.been.calledOnce;
                        expect(serialStub).to.have.been.calledWith([{ stepTo: 'end' }]);
                    });
                });
                it('should allow changing the initial operation', function () {
                    var rs = new F.service.Run(runOptions);
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
                    var rs = new F.service.Run(runOptions);
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
                        expect(args[0].name).to.eql('batman');
                        expect(args[0].saved).to.eql(true);
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
                var sm = new ScenarioManager({ run: runOptions, currentRun: { account: 'batman' } });
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
                it('should return last unsaved run if found', function () {
                    var rs = new F.service.Run(runOptions);
                    var sampleRun = {
                        id: 'run1',
                        name: 'food',
                        saved: false
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
                    var rs = new F.service.Run(runOptions);
                    sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                    var createStub = sinon.stub(rs, 'create').returns($.Deferred().resolve({ id: 'foo' }).promise());
                    var sm = new ScenarioManager({ run: rs });
                    return sm.current.getRun().then(function (run) {
                        expect(createStub).to.have.been.calledOnce;
                    });
                });

                it('should clone to create new run if last run was saved', function () {
                    var rs = new F.service.Run(runOptions);
                    var sampleRun = {
                        id: 'run1',
                        name: 'food',
                        saved: true
                    };
                    sinon.stub(rs, 'query').returns($.Deferred().resolve([sampleRun]).promise());
                    var loadStub = sinon.stub(rs, 'load').returns($.Deferred().resolve(sampleRun).promise());
                    sinon.stub(rs, 'save').returns($.Deferred().resolve({}).promise());
                    var sm = new ScenarioManager({ run: rs });
                    return sm.current.getRun().then(function (run) {
                        expect(server.requests.length).to.eql(1);
                        expect(loadStub).to.have.been.calledWith('foo');
                    });
                });
                it('should exclude the right operations from clone', function () {
                    var rs = new F.service.Run(runOptions);
                    var sampleRun = {
                        id: 'run1',
                        name: 'food',
                        saved: true
                    };
                    sinon.stub(rs, 'query').returns($.Deferred().resolve([sampleRun]).promise());
                    sinon.stub(rs, 'load').returns($.Deferred().resolve(sampleRun).promise());
                    sinon.stub(rs, 'save').returns($.Deferred().resolve({}).promise());
                    var sm = new ScenarioManager({ 
                        run: rs,
                        advanceOperation: [{ foo: 'bar' }]
                    });
                    return sm.current.getRun().then(function (run) {
                        var req = server.requests[0];
                        expect(server.requests.length).to.eql(1);
                        expect(req.requestBody).to.eql(JSON.stringify({ action: 'clone', exclude: ['foo'] }));
                    });
                });
            });
            describe('#saveAndAdvance', function () {
                it('should update the current run', function () {
                    var rs = new F.service.Run(runOptions);
                    var sampleRun = {
                        id: 'run1',
                        name: 'food',
                        saved: true
                    };
                    var serialStub = sinon.stub(rs, 'serial').returns($.Deferred().resolve([sampleRun]).promise());
                    var sm = new ScenarioManager({ 
                        run: rs,
                        advanceOperation: [{ foo: 'bar' }]
                    });
                    var saveStub = sinon.stub(sm.savedRuns, 'save').returns($.Deferred().resolve({}).promise());
                    sinon.stub(sm.current, 'getRun').returns($.Deferred().resolve({ id: 'foo' }).promise());
                    return sm.current.saveAndAdvance({ name: 'robin' }).then(function (run) {
                        expect(serialStub).to.have.been.calledOnce;
                        expect(serialStub).to.have.been.calledWith([{ foo: 'bar' }]);

                        expect(saveStub).to.have.been.calledOnce;
                        var args = saveStub.getCall(0).args;
                        expect(args[1].name).to.eql('robin');
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
}());
