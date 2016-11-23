(function () {
    'use strict';

    var Strategy = F.manager.strategy['conditional-creation'];

    var fakeAuth = {
        // get should return what's stoed in the session cookie
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
            it('should call rs.create with the initial params', function () {
                var runOptions = {
                    model: 'model.eqn',
                    account: 'forio-dev',
                    project: 'js-libs'
                };
                var rs = new F.service.Run(runOptions);
                rs.create = sinon.spy(function () {
                    return $.Deferred().resolve({
                        id: 'abc'
                    }).promise();
                });
                var rm = new F.manager.RunManager({
                    strategy: 'always-new',
                    run: rs
                });
                return rm.getRun().then(function () {
                    expect(rs.create).to.have.been.calledOnce;

                    var args = rs.create.getCall(0).args;
                    expect(args[0]).to.contain.all.keys(runOptions);
                });
            });

            describe.only('when a run exists in session', function () {
                var rs, loadStub, createStub;
                var dummyRunid = 'foo';

                beforeEach(function () {
                    rs = new F.service.Run(runOptions);
                    loadStub = sinon.stub(rs, 'load', function (runid, filter, options) {
                        options.success();
                        return $.Deferred().resolve([{
                            id: runid
                        }]).promise();
                    });
                    createStub = sinon.stub(rs, 'create', function () {
                        return $.Deferred().resolve({
                            id: 'def'
                        }).promise();
                    });
                });
                afterEach(function () {
                    rs.load.restore();
                    rs.create.restore();
                });

                it('should try to load it', function () {
                    var rm = new Strategy(true, {
                        run: rs
                    });
                    rm._auth = fakeAuth;
                    rm.sessionManager = createFakeSessionStore(dummyRunid);
                    return rm.getRun(rs).then(function () {
                        expect(loadStub).to.have.been.calledOnce;
                        var args = loadStub.getCall(0).args;
                        expect(args[0]).to.eql(dummyRunid);
                    });
                });

                describe('create condition', function () {
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
            });

            // describe('when no run exists', function () {
            //     it.only('should create a run with the correct scope', function () {
                
            //         var rs = new F.service.Run(runOptions);

            //         var createStub = sinon.stub(rs, 'create', function () {
            //             return $.Deferred().resolve({
            //                 id: 'def'
            //             }).promise();
            //         });
                    
            //         var rm = new F.manager.RunManager({
            //             strategy: 'always-new',
            //             run: rs
            //         });
            //         rm.strategy._auth = fakeAuth;
            //         rm.strategy.sessionManager = dummySessionStore;
            //         return rm.getRun().then(function () {
            //             expect(loadStub).to.have.been.calledOnce;

            //             var args = createStub.getCall(0).args;
            //             expect(args[0].scope).to.eql({ group: 'group-123' });
            //         });
            //     });
            // });
        });
    });

}());