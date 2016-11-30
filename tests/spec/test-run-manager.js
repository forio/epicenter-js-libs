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

        describe.only('#getRun', function () {
            it('should call the strategy\'s getRun', function () {
                var getRunSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: 'newrun' }).promise();
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
                }).getRun();
                expect(getRunSpy).to.have.been.calledOnce;
            });
            it('should be called with the right run service', function () {
                var getRunSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: 'newrun' }).promise();
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
                }).getRun();
                expect(getRunSpy.getCall(0).args[0]).to.be.instanceof(F.service.Run);
                expect(getRunSpy).to.have.been.calledOnce;
            });
            it('should update current run instance after creation', function () {
                var runid = 'myNewRunId';
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

                return rm.getRun().then(function () {
                    var config = rm.run.getCurrentConfig();
                    expect(config.id).to.equal(runid);
                });
            });
        });
        describe('#reset', function () {
            it('should call the strategy\'s getRun', function () {
                var resetSpy = sinon.spy();
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
                }).reset();
                expect(resetSpy).to.have.been.calledOnce;
            });
            it('should be called with the right run service', function () {
                var resetSpy = sinon.spy();
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
                }).reset();
                expect(resetSpy.getCall(0).args[0]).to.be.instanceof(F.service.Run);
            });
        });
    });

}());