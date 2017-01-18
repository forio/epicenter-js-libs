(function () {
    'use strict';

    var SavedRunsManager = F.manager.SavedRunsManager;
    var RunService = F.service.Run;

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs',
    };

    var baseURL = (new F.service.URL({ accountPath: runOptions.account, projectPath: runOptions.project })).getAPIPath('run');
    describe('Saved Runs Manager', function () {
        var server;
        var rs, saveStub, srm;

        beforeEach(function () {
            server = sinon.fakeServer.create();
            server.respondWith('PATCH', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondWith('GET', /(.*)\/run\/[^\/]*\/[^\/]*\/[^\/]*\/[^\/]*\/\?include=(.*)/, function (xhr, prefix, variable) {
                if (variable === 'fail') {
                    xhr.respond(400);
                } else {
                    xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ price: 2 }));
                }
            });

            server.respondImmediately = true;

            rs = new RunService(runOptions);
            saveStub = sinon.stub(rs, 'save', function (params) {
                return $.Deferred().resolve(params).promise();
            });
            srm = new SavedRunsManager({
                run: runOptions
            });
        });

        afterEach(function () {
            server.restore();
        });
        describe('constructor options', function () {
            describe('run', function () {
                it('creates a run member property if passed in run options', function () {
                    var srm = new SavedRunsManager({
                        run: runOptions
                    });
                    expect(srm.runService).to.be.instanceof(RunService);
                });
                it('creates a run member property if passed in a runservice', function () {
                    var rs = new RunService(runOptions);
                    var srm = new SavedRunsManager({
                        run: rs
                    });
                    expect(srm.runService).to.be.instanceof(RunService);
                });
                it('should throw an error if no run passed in', function () {
                    expect(function () { new SavedRunsManager({ }); }).to.throw(Error);
                });
            });
        });

        describe('#save', function () {
            it('should call the run service with the right flags', function () {
                return srm.save(rs).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: true, trashed: false });
                });
            });
            it('should allow passing in additonal fields', function () {
                return srm.save(rs, { name: 'foo' }).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: true, trashed: false, name: 'foo' });
                });
            });
            it('allow passing in string runids', function () {
                return srm.save('food', { name: 'foo' }).then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'food/');
                    expect(JSON.parse(req.requestBody)).to.eql({ saved: true, trashed: false, name: 'foo' });
                });
            });
            it('should throw an error for invalid run service provided', function () {
                expect(function () { srm.save(); }).to.throw(Error);
            });
        });
        describe('#remove', function () {
            it('should call the run service with the right flags', function () {
                return srm.remove(rs).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: false, trashed: true });
                });
            });
            it('should allow passing in additonal fields', function () {
                return srm.remove(rs, { name: 'foo' }).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: false, trashed: true, name: 'foo' });
                });
            });
            it('allow passing in string runids', function () {
                return srm.remove('food', { name: 'foo' }).then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'food/');
                    expect(JSON.parse(req.requestBody)).to.eql({ saved: false, trashed: true, name: 'foo' });
                });
            });
            it('should throw an error for invalid run service provided', function () {
                expect(function () { srm.remove(); }).to.throw(Error);
            });
        });
        describe('#mark', function () {
            it('should call the run service with the right flags', function () {
                return srm.mark(rs, { foo: 'bar' }).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ foo: 'bar' });
                });
            });
            it('allow passing in string runids', function () {
                return srm.mark('food', { name: 'foo' }).then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'food/');
                    expect(JSON.parse(req.requestBody)).to.eql({ name: 'foo' });
                });
            });
            it('should throw an error for invalid run service provided', function () {
                expect(function () { srm.mark(); }).to.throw(Error);
            });
        });

        describe('#getRuns', function () {
            var rs, queryStub, srm;
            beforeEach(function () {
                rs = new F.service.Run(runOptions);
                queryStub = sinon.stub(rs, 'query', function (options) {
                    return $.Deferred().resolve([
                        { id: 'run1' },
                        { id: 'run2' },
                    ]).promise();
                });
                srm = new SavedRunsManager({
                    run: rs
                });
            });

            it('should pass the right saved filter', function () {
                return srm.getRuns().then(function () {
                    expect(queryStub).to.have.been.calledOnce;

                    var args = queryStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: true, trashed: false });
                });
            });
            it('should allow passing in additonal filters', function () {
                return srm.getRuns(null, { foo: 'bar' }).then(function () {
                    expect(queryStub).to.have.been.calledOnce;

                    var args = queryStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: true, trashed: false, foo: 'bar' });
                });
            });
            it('should return an array of runs', function () {
                return srm.getRuns().then(function (runs) {
                    expect(runs).to.eql([
                        { id: 'run1' },
                        { id: 'run2' },
                    ]);
                });
            });

            describe('User Session', function () {
                it('should query by group name if session available', function () {
                    var sessionStub = sinon.stub(srm.sessionManager, 'getSession').returns({
                        groupName: 'foo'
                    });
                    return srm.getRuns().then(function (runs) {
                        var args = queryStub.getCall(0).args;
                        expect(args[0]['scope.group']).to.eql('foo');
                        sessionStub.restore();
                    });
                });
                it('should not query by group name if told not to', function () {
                    var srm = new SavedRunsManager({
                        run: rs,
                        scopeByGroup: false,
                    });
                    var sessionStub = sinon.stub(srm.sessionManager, 'getSession').returns({
                        groupName: 'foo'
                    });
                    return srm.getRuns().then(function (runs) {
                        var args = queryStub.getCall(0).args;
                        expect(args[0]['scope.group']).to.eql(undefined);
                        sessionStub.restore();
                    });

                });
                it('should query by user if session available', function () {
                    var sessionStub = sinon.stub(srm.sessionManager, 'getSession').returns({
                        userId: 'foo'
                    });
                    return srm.getRuns().then(function (runs) {
                        var args = queryStub.getCall(0).args;
                        expect(args[0]['user.id']).to.eql('foo');
                        sessionStub.restore();
                    });
                });
                it('should not query by userid if told not to', function () {
                    var srm = new SavedRunsManager({
                        run: rs,
                        scopeByUser: false,
                    });
                    var sessionStub = sinon.stub(srm.sessionManager, 'getSession').returns({
                        userId: 'foo'
                    });
                    return srm.getRuns().then(function (runs) {
                        var args = queryStub.getCall(0).args;
                        expect(args[0]['user.id']).to.eql(undefined);
                        sessionStub.restore();
                    });

                });
            });

            describe('Variables', function () {
                it('should pass variables to variables service', function () {
                    return srm.getRuns('Price', { foo: 'bar' }).then(function (res) {
                        var req = server.requests[0];
                        expect(req.url).to.eql('https://api.forio.com/v2/run/forio-dev/js-libs/run1/variables/?include=Price');
                    });
                });
                it('should add variables to response', function () {
                    return srm.getRuns('Price', { foo: 'bar' }).then(function (runs) {
                        expect(runs).to.eql([
                            { id: 'run1', variables: { price: 2 } },
                            { id: 'run2', variables: { price: 2 } },
                        ]);
                    });
                });
                it('should ignore failed variables for any run', function () {
                    var successSpy = sinon.spy(function (r) {
                        return r;
                    });
                    var failSpy = sinon.spy(function (r) {
                        return r;
                    });
                    return srm.getRuns('fail', { foo: 'bar' }).then(successSpy).catch(failSpy).then(function (runs) {
                        expect(successSpy).to.have.been.called;
                        expect(failSpy).to.not.have.been.called;
                        expect(runs).to.eql([
                            { id: 'run1', variables: {} },
                            { id: 'run2', variables: {} },
                        ]);
                    });
                });
            });
        });
    });
}());