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
            
            // General GET
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
            describe('on getRun', function () {
                it('should return existing runs if it finds one', function () {
                    var rs = new F.service.Run(runOptions);
                    var sampleBaseline = {
                        id: 'run1',
                        name: 'baseline',
                        saved: true
                    };
                    sinon.stub(rs, 'filter').returns($.Deferred().resolve([
                        sampleBaseline
                    ]).promise());
                    var sm = new ScenarioManager({ run: rs });
                    return sm.baseline.getRun().then(function (run) {
                        expect(run).to.eql(sampleBaseline);
                    });
                });
                it('should create & step if no existing runs found', function () {
                    var rs = new F.service.Run(runOptions);
                    sinon.stub(rs, 'filter').returns($.Deferred().resolve([]).promise());
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
                    sinon.stub(rs, 'filter').returns($.Deferred().resolve([]).promise());
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
                    sinon.stub(rs, 'filter').returns($.Deferred().resolve([]).promise());
                    var sm = new ScenarioManager({ 
                        run: rs,
                        baselineRunName: 'batman'
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
            it('should pass through the right options', function () {
                var sm = new ScenarioManager({ run: runOptions });
                sinon.stub(sm.current.sessionManager, 'getSession').returns(sampleSession);

                return sm.current.getRun().then(function (run) {
                    var config = sm.current.run.getCurrentConfig();
                    expect(config.account).to.equal(runOptions.account);
                    expect(config.project).to.equal(runOptions.project);
                });
            });
        });
        describe('saved runs', function () {
            it('should create a new saved run manager', function () {
                var sm = new ScenarioManager({ run: runOptions });
                expect(sm.savedRuns).to.be.instanceof(SavedRunsManager);
            });
        });
       
    });
}());
