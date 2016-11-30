(function () {
    'use strict';

    var Strategy = F.manager.strategy['conditional-creation'];

    var fakeAuth = {
        // get should return what's stored in the session cookie
        getCurrentUserSessionInfo: sinon.stub().returns({
            auth_token: '',
            account: 'forio-dev',
            project: 'js-libs',
            userId: '123',
            groupId: 'group123',
            groupName: 'group-123',
            isFac: false
        })
    };

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };

    function createFakeSessionStore(runid) {
        var dummySessionStore = {
            getStore: function () {
                return {
                    get: function () { 
                        return runid ? JSON.stringify({
                            runId: runid
                        }) : null;
                    },
                    set: function () { },
                };
            }
        };
        return dummySessionStore;
    }

    describe('Conditional Creation Strategy', function () {
        describe('getRun', function () {
            describe('if a run exists in session', function () {
                var rs, loadStub, createStub;
                var dummyRunid = 'foo';

                beforeEach(function () {
                    rs = new F.service.Run(runOptions);
                    createStub = sinon.stub(rs, 'create', function (options) {
                        return $.Deferred().resolve({
                            id: 'def'
                        }).promise();
                    });
                    loadStub = sinon.stub(rs, 'load', function (runid, filters, options) {
                        options.success({ id: runid });
                        return $.Deferred().resolve({ id: runid }).promise();
                    });
                });

                it('should try to load it', function () {
                    var rm = new Strategy(true, { run: rs });
                    rm._auth = fakeAuth;
                    rm.sessionManager = createFakeSessionStore(dummyRunid);

                    return rm.getRun(rs).then(function () {
                        expect(loadStub).to.have.been.calledOnce;
                        var args = loadStub.getCall(0).args;
                        expect(args[0]).to.eql(dummyRunid);
                    });
                });
                
                describe('if loading succeeds', function () {
                    it('should create a new run if condition is true', function () {
                        var rm = new Strategy(true, {
                            run: rs
                        });
                        rm._auth = fakeAuth;
                        rm.sessionManager = createFakeSessionStore(dummyRunid);
                        return rm.getRun(rs).then(function () {
                            expect(createStub).to.have.been.calledOnce;
                            var args = createStub.getCall(0).args;
                            expect(args[0]).to.contain.all.keys(runOptions);
                        });
                    });
                    it('should not create a new run if condition is false', function () {
                        var rm = new Strategy(false, {
                            run: rs
                        });
                        rm._auth = fakeAuth;
                        rm.sessionManager = createFakeSessionStore(dummyRunid);
                        return rm.getRun(rs).then(function () {
                            expect(createStub).to.not.have.been.called;
                        });
                    });
                });
                describe('if loading fails', function () {
                    it('should default to reset', function () {
                        var rs = new F.service.Run(runOptions);
                        var rm = new Strategy(true, { run: rs });
                        rm._auth = fakeAuth;
                        rm.sessionManager = createFakeSessionStore(dummyRunid);

                        sinon.stub(rs, 'load', function () {
                            return $.Deferred().reject('blah').promise();
                        });
                        var resetStub = sinon.stub(rm, 'reset', function () { 
                            return $.Deferred().resolve('works').promise();
                        });

                        var failSpy = sinon.spy();
                        return rm.getRun(rs).then(function () {
                            expect(resetStub).to.have.been.calledOnce;
                        }, failSpy).then(function () {
                            expect(failSpy).to.not.have.been.called;
                        });
                    });
                });
            });

            describe('if a run does not exist in session', function () {
                it('should call reset', function () {
                    var fakeAuth = {
                        getCurrentUserSessionInfo: sinon.stub().returns({})
                    };

                    var rs = new F.service.Run(runOptions);
                    var rm = new Strategy(true, { run: rs });
                    rm._auth = fakeAuth;
                    rm.sessionManager = createFakeSessionStore();

                    var loadStub = sinon.stub(rs, 'load', function () {
                        return $.Deferred().resolve().promise();
                    });
                    var resetStub = sinon.stub(rm, 'reset', function () { 
                        return $.Deferred().resolve('works').promise();
                    });

                    var failSpy = sinon.spy();
                    return rm.getRun(rs).then(function () {
                        expect(loadStub).to.not.have.been.called;
                        expect(resetStub).to.have.been.calledOnce;
                    }, failSpy).then(function () {
                        expect(failSpy).to.not.have.been.called;
                    });
                });
            });

            describe('#reset', function () {
                it('should call rs.create with the initial params', function () {
                    var rs = new F.service.Run(runOptions);
                    var createStub = sinon.stub(rs, 'create', function () {
                        return $.Deferred().resolve({
                            id: 'def'
                        }).promise();
                    });

                    var rm = new Strategy(true, { run: rs });
                    rm._auth = fakeAuth;
                    rm.sessionManager = createFakeSessionStore();

                    return rm.reset(rs).then(function () {
                        expect(createStub).to.have.been.calledOnce;
                        var args = rs.create.getCall(0).args;
                        expect(args[0]).to.contain.all.keys(runOptions);
                    });
                });
                it('should create a run with the correct scope', function () {
                    var rs = new F.service.Run(runOptions);
                    var createStub = sinon.stub(rs, 'create', function () {
                        return $.Deferred().resolve({
                            id: 'def'
                        }).promise();
                    });

                    var rm = new Strategy(true, { run: rs });
                    rm._auth = fakeAuth;
                    rm.sessionManager = createFakeSessionStore();
                    
                    return rm.reset(rs).then(function () {
                        expect(createStub).to.have.been.calledOnce;
                        var args = createStub.getCall(0).args;
                        expect(args[0].scope).to.eql({ group: 'group-123' });
                    });
                });
            });
        });
    });
}());