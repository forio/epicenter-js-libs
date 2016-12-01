(function () {
    'use strict';

    var Strategy = F.manager.strategy['conditional-creation'];

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };

    describe('Conditional Creation Strategy', function () {
        describe('getRun', function () {
            describe('if a runid is passed in', function () {
                var rs, loadStub;
                var dummyRunid = 'foo';

                beforeEach(function () {
                    rs = new F.service.Run(runOptions);
                    sinon.stub(rs, 'create', function (options) {
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
                    var rm = new Strategy(true);
                    return rm.getRun(rs, dummyRunid).then(function () {
                        expect(loadStub).to.have.been.calledOnce;
                        var args = loadStub.getCall(0).args;
                        expect(args[0]).to.eql(dummyRunid);
                    });
                });
                
                describe('if loading succeeds', function () {
                    it('should reset if condition is true', function () {
                        var rm = new Strategy(true);
                        var resetStub = sinon.stub(rm, 'reset', function () { 
                            return $.Deferred().resolve('works').promise();
                        });
                        return rm.getRun(rs, dummyRunid).then(function () {
                            expect(resetStub).to.have.been.calledOnce;
                        });
                    });
                    it('should not create a new run if condition is false', function () {
                        var rm = new Strategy(false);
                        var resetStub = sinon.stub(rm, 'reset', function () { 
                            return $.Deferred().resolve('works').promise();
                        });
                        return rm.getRun(rs, dummyRunid).then(function () {
                            expect(resetStub).to.not.have.been.called;
                        });
                    });
                });
                describe('if loading fails', function () {
                    it('should default to reset', function () {
                        var rs = new F.service.Run(runOptions);
                        var loadStub = sinon.stub(rs, 'load', function () {
                            return $.Deferred().reject('blah').promise();
                        });

                        var rm = new Strategy(false);
                        var resetStub = sinon.stub(rm, 'reset', function () { 
                            return $.Deferred().resolve('works').promise();
                        });

                        var failSpy = sinon.spy();
                        return rm.getRun(rs, dummyRunid).then(function () {
                            expect(loadStub).to.have.been.calledOnce;
                            expect(resetStub).to.have.been.calledOnce;
                        }, failSpy).then(function () {
                            expect(failSpy).to.not.have.been.called;
                        });
                    });
                });
            });

            describe('if a run is not passed in', function () {
                it('should call reset', function () {
                    var rs = new F.service.Run(runOptions);
                    var loadStub = sinon.stub(rs, 'load', function () {
                        return $.Deferred().resolve().promise();
                    });

                    var rm = new Strategy(true);
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
        });
        describe('#reset', function () {
            it('should call rs.create with the initial params', function () {
                var rs = new F.service.Run(runOptions);
                var createStub = sinon.stub(rs, 'create', function () {
                    return $.Deferred().resolve({
                        id: 'def'
                    }).promise();
                });

                var rm = new Strategy(true);
                return rm.reset(rs).then(function () {
                    expect(createStub).to.have.been.calledOnce;
                    var args = rs.create.getCall(0).args;
                    expect(args[0]).to.contain.all.keys(runOptions);
                });
            });
            it('should create a run with the correct scope if session is passed in', function () {
                var rs = new F.service.Run(runOptions);
                var createStub = sinon.stub(rs, 'create', function () {
                    return $.Deferred().resolve({
                        id: 'def'
                    }).promise();
                });

                var rm = new Strategy(true);
                return rm.reset(rs, { groupName: 'group-123' }).then(function () {
                    expect(createStub).to.have.been.calledOnce;
                    var args = createStub.getCall(0).args;
                    expect(args[0].scope).to.eql({ group: 'group-123' });
                });
            });
        });
    });
}());