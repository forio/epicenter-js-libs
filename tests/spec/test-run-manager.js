(function () {
    'use strict';

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs',
    };

    var sampleSession = {
        auth_token: '',
        account: 'forio-dev',
        project: 'js-libs',
        userId: '123',
        groupId: 'group123',
        groupName: 'group-123',
        isFac: false
    };
    var fakeAuth = {
        // get should return what's stored in the session cookie
        getCurrentUserSessionInfo: sinon.stub().returns(sampleSession)
    };

    describe('Run Manager', function () {
        describe('constructor options', function () {
            describe('run', function () {
                it('creates a run member property if passed in run options', function () {
                    var rm = new F.manager.RunManager({
                        strategy: 'always-new',
                        run: runOptions
                    });
                    expect(rm.run).to.be.instanceof(F.service.Run);
                });
                it('creates a run member property if passed in a runservice', function () {
                    var rs = new F.service.Run(runOptions);
                    var rm = new F.manager.RunManager({
                        strategy: 'always-new',
                        run: rs
                    });
                    expect(rm.run).to.be.instanceof(F.service.Run);
                });
                it('should throw an error if no run passed in', function () {
                    expect(function () { new F.manager.RunManager({ strategy: 'always-new' }); }).to.throw(Error);
                });
            });
            describe('strategy', function () {
                it('should allow passing in known strategy names', function () {
                    expect(function () { new F.manager.RunManager({ strategy: 'always-new', run: runOptions }); }).to.not.throw(Error);
                });
                it('should throw an error with unknown strategy names', function () {
                    expect(function () { new F.manager.RunManager({ strategy: 'booya', run: runOptions }); }).to.throw(Error);
                });
                it('should pick default strategy name if none provided', function () {
                    expect(function () { new F.manager.RunManager({ run: runOptions }); }).to.not.throw(Error);
                });
                it('should allow custom strategy functions', function () {
                    var myStrategy = function () {
                        return {
                            getRun: sinon.spy(),
                            reset: sinon.spy(),
                        };
                    };
                    var strategySpy = sinon.spy(myStrategy);
                    new F.manager.RunManager({
                        strategy: strategySpy,
                        run: runOptions,
                    });
                    expect(strategySpy.calledWithNew()).to.equal(true);
                });
                it('should throw an error if strategy doesn\'t match format', function () {
                    var myStrategy = function () {
                        return {
                            a: sinon.spy(),
                            v: sinon.spy(),
                        };
                    };
                    var strategySpy = sinon.spy(myStrategy);
                    expect(function () { new F.manager.RunManager({ strategy: strategySpy, run: runOptions }); }).to.throw(Error);
                });
            });
        });

        describe('User Session', function () {
            it('should pass in session to #getRun', function () {
                var runid = 'dummyrunid';
                var getRunSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var myStrategy = function () {
                    return {
                        getRun: getRunSpy,
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                var rm = new F.manager.RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
                rm.authManager = fakeAuth;
                return rm.getRun().then(function () {
                    expect(getRunSpy.getCall(0).args[1]).to.eql(sampleSession);
                });
            });
            it('should pass in session to #reset', function () {
                var runid = 'dummyrunid';

                var resetSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var myStrategy = function () {
                    return {
                        getRun: sinon.spy(),
                        reset: resetSpy,
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                var rm = new F.manager.RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
                rm.authManager = fakeAuth;
                return rm.reset().then(function () {
                    expect(resetSpy.getCall(0).args[1]).to.eql(sampleSession);
                });
            });
        });
        describe('Run Session', function () {
            var getSpy, setSpy, dummySessionStore;
            beforeEach(function () {
                getSpy = sinon.spy(function (runid) { 
                    return runid ? JSON.stringify({
                        runId: runid
                    }) : null;
                });
                setSpy = sinon.spy();

                dummySessionStore = {
                    getStore: function () {
                        return {
                            get: getSpy,
                            set: setSpy,
                        };
                    }
                };
            });

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
            it('should pass runid in session into strategy', function () {
                var runid = 'dummyrunid';
                var getRunSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var myStrategy = function () {
                    return {
                        getRun: getRunSpy,
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                var rm = new F.manager.RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
                rm.sessionManager = createFakeSessionStore(runid);
                return rm.getRun().then(function () {
                    expect(getRunSpy.getCall(0).args[2]).to.equal(runid);
                });
            });

            it('should update store with sessionkey name after run creation', function () {
                var sampleRunid = 'samplerunid';
                var rs = new F.service.Run(runOptions);
                sinon.stub(rs, 'create', function (options) {
                    return $.Deferred().resolve({
                        id: sampleRunid
                    }).promise();
                });
                sinon.stub(rs, 'load', function (runid, filters, options) {
                    options.success({ id: runid });
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var rm = new F.manager.RunManager({
                    strategy: 'always-new',
                    run: rs,
                });
                rm.sessionManager = dummySessionStore;
                return rm.getRun().then(function () {
                    expect(setSpy).to.have.been.calledOnce;
                });
            });
            describe('custom session keys', function () {
                it('should read from custom session keys', function () {
                    var myStrategy = function () {
                        return {
                            getRun: sinon.spy(function () {
                                return $.Deferred().resolve({ id: 'runid' }).promise();
                            }),
                            reset: sinon.spy(),
                        };
                    };
                    var strategySpy = sinon.spy(myStrategy);
                    var rm = new F.manager.RunManager({
                        sessionKey: 'abc',
                        strategy: strategySpy,
                        run: runOptions,
                    });
                    rm.sessionManager = dummySessionStore;
                    return rm.getRun().then(function () {
                        expect(setSpy.getCall(0).args[0]).to.equal('abc');
                    });
                });
                it('should set custom session keys', function () {
                    var sampleRunid = 'samplerunid';
                    var rs = new F.service.Run(runOptions);
                    sinon.stub(rs, 'create', function (options) {
                        return $.Deferred().resolve({
                            id: sampleRunid
                        }).promise();
                    });
                    sinon.stub(rs, 'load', function (runid, filters, options) {
                        options.success({ id: runid });
                        return $.Deferred().resolve({ id: runid }).promise();
                    });
                    var rm = new F.manager.RunManager({
                        sessionKey: 'abc',
                        strategy: 'always-new',
                        run: rs,
                    });
                    rm.sessionManager = dummySessionStore;
                    return rm.getRun().then(function () {
                        expect(setSpy).to.have.been.calledOnce;

                        var args = setSpy.getCall(0).args;
                        expect(args[0]).to.equal('abc');
                        expect(args[1]).to.equal(JSON.stringify({ runId: sampleRunid }));
                    });
                });
            });
            
        });
        describe('#getRun', function () {
            var rm, runid = 'newrun', getRunSpy, strategySpy;
            beforeEach(function () {
                getRunSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var myStrategy = function () {
                    return {
                        getRun: getRunSpy,
                        reset: sinon.spy(),
                    };
                };
                strategySpy = sinon.spy(myStrategy);
                rm = new F.manager.RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
            });
            it('should call the strategy\'s getRun', function () {
                return rm.getRun().then(function () {
                    expect(getRunSpy).to.have.been.calledOnce;
                });
            });
            it('should be called with the right run service', function () {
                return rm.getRun().then(function () {
                    expect(getRunSpy.getCall(0).args[0]).to.be.instanceof(F.service.Run);
                });
            });
            it('should update current run instance after creation', function () {
                return rm.getRun().then(function () {
                    var config = rm.run.getCurrentConfig();
                    expect(config.id).to.equal(runid);
                });
            });
        });
        describe('#reset', function () {
            var rm, runid = 'resetrun', resetSpy;
            beforeEach(function () {
                resetSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var myStrategy = function () {
                    return {
                        getRun: sinon.spy(),
                        reset: resetSpy,
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                rm = new F.manager.RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
            });
            it('should call the strategy\'s getRun', function () {
                return rm.reset().then(function () {
                    expect(resetSpy).to.have.been.calledOnce;
                });
            });
            it('should be called with the right run service', function () {
                return rm.reset().then(function () {
                    expect(resetSpy.getCall(0).args[0]).to.be.instanceof(F.service.Run);
                });
            });
            it('should update current run instance after creation', function () {
                return rm.reset().then(function () {
                    var config = rm.run.getCurrentConfig();
                    expect(config.id).to.equal(runid);
                });
            });
        });
    });
}());