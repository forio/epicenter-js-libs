(function () {
    'use strict';

    var ScenarioManager = F.manager.ScenarioManager;
    var RunManager = F.manager.RunManager;
    var SavedRunsManager = F.manager.SavedRunsManager;

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
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

    describe.only('Scenario Manager', function () {
        var server;
        beforeEach(function () {
            server = sinon.fakeServer.create();
            server.respondWith('PATCH', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondWith('POST', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
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
                var sm = new ScenarioManager();
                expect(sm.baseline).to.be.instanceof(RunManager);
            });
            it('should pass through the right options', function () {
                var sm = new ScenarioManager(runOptions);
                sinon.stub(sm.baseline.sessionManager, 'getSession').returns(sampleSession);

                return sm.baseline.getRun().then(function (run) {
                    var config = sm.baseline.run.getCurrentConfig();
                    expect(config.account).to.equal(runOptions.account);
                    expect(config.project).to.equal(runOptions.project);
                });
            });
        });
        describe('current run', function () {
            it('should create a new current run manager', function () {
                var sm = new ScenarioManager();
                expect(sm.current).to.be.instanceof(RunManager);
            });
            it('should pass through the right options', function () {
                var sm = new ScenarioManager(runOptions);
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
                var sm = new ScenarioManager();
                expect(sm.savedRuns).to.be.instanceof(SavedRunsManager);
            });
        });
       
    });
}());
