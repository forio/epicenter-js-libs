(function () {
    'use strict';

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs',
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

            describe('with session', function () {
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
                    var rm = new F.manager.RunManager({
                        strategy: strategySpy,
                        run: runOptions,
                    });
                    rm.sessionManager = createFakeSessionStore('dummyrunid');
                    return rm.getRun().then(function () {
                        expect(getRunSpy.getCall(0).args[1]).to.equal('dummyrunid');
                    });
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