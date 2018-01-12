(function () {
    'use strict';

    var Strategy = F.manager.strategy['reuse-last-initialized'];
    var runOptions = {
        account: 'forio-dev',
        project: 'js-libs'
    };
    describe('Reuse last initialized', function () {
        describe('Options', function () {
            it('should throw an error if no options provided', function () {
                var c = function () { new Strategy(); };
                expect(c).to.throw(Error);
            });
        }); 

        describe('#getRun', function () {
            var rs, strategy, resetStub, queryStub;
            beforeEach(function () {
                rs = new F.service.Run(runOptions);
                queryStub = sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                strategy = new Strategy({
                    strategyOptions: {
                        initOperation: ['foo'],
                        flag: {
                            foo: 'bar'
                        }
                    }
                });
                resetStub = sinon.stub(strategy, 'reset').returns($.Deferred().resolve({}).promise());
            });
            it('should filter for runs matching flag', function () {
                return strategy.getRun(rs).then(function () {
                    expect(queryStub).to.have.been.calledWith({
                        foo: 'bar'
                    });
                });
            });
            it('should filter by groupname if provided', function () {
                return strategy.getRun(rs, { groupName: 'groupName' }).then(function () {
                    expect(queryStub).to.have.been.calledWith({
                        foo: 'bar',
                        'scope.group': 'groupName',
                    });
                });
            });
            it('should filter by model name where provided', function () {
                var rs = new F.service.Run($.extend(true, {}, runOptions, { model: 'model.eqn' }));
                var queryStub = sinon.stub(rs, 'query').returns($.Deferred().resolve([]).promise());
                var strategy = new Strategy({
                    strategyOptions: {
                        initOperation: ['foo'],
                        flag: {
                            foo: 'bar'
                        }
                    }
                });
                sinon.stub(strategy, 'reset').returns($.Deferred().resolve({}).promise());
                return strategy.getRun(rs, { groupName: 'groupName' }).then(function () {
                    expect(queryStub).to.have.been.calledWith({
                        foo: 'bar',
                        'scope.group': 'groupName',
                        model: 'model.eqn',
                    });
                });
            });
            it('should filter by userId if provided', function () {
                return strategy.getRun(rs, { userId: 'userId' }).then(function () {
                    expect(queryStub).to.have.been.calledWith({
                        foo: 'bar',
                        'user.id': 'userId',
                    });
                });
            });
            it('should call reset if not found', function () {
                return strategy.getRun(rs, { userId: 'userId' }).then(function () {
                    expect(resetStub).to.have.been.calledOnce;
                });
            });
            it('should return the run if found', function () {
                var rs = new F.service.Run(runOptions);
                sinon.stub(rs, 'query').returns($.Deferred().resolve([{ id: 'x' }]).promise());
                return strategy.getRun(rs, { userId: 'userId' }).then(function (run) {
                    expect(resetStub).to.not.have.been.called;
                    expect(run).to.eql({ id: 'x' });
                });
            });
        });
        describe('#reset', function () {
            var rs, createStub, serialStub, saveStub, strategy;
            beforeEach(function () {
                rs = new F.service.Run(runOptions);
                createStub = sinon.stub(rs, 'create').returns($.Deferred().resolve({ id: 'x' }).promise());
                serialStub = sinon.stub(rs, 'serial').returns($.Deferred().resolve({ name: 'x', result: 'foo' }).promise());
                saveStub = sinon.stub(rs, 'save', function (args) {
                    return $.Deferred().resolve(args).promise();
                });
                strategy = new Strategy({
                    strategyOptions: {
                        initOperation: ['foo'],
                        flag: {
                            foo: 'bar'
                        }
                    }
                });
            });

            it('should create a new run', function () {
                return strategy.reset(rs).then(function () {
                    expect(createStub).to.have.been.calledOnce;
                });
            });
            it('should pass through options to create', function () {
                var options = { sucess: sinon.spy() };
                return strategy.reset(rs, {}, options).then(function () {
                    var args = createStub.getCall(0).args;

                    expect(args[0].model).to.eql(runOptions.model);
                    expect(args[1]).to.eql(options);
                });
            });
            it('should call `serial` on the new run with the new operations', function () {
                return strategy.reset(rs).then(function () {
                    expect(serialStub).to.have.been.calledOnce;
                    expect(serialStub).to.have.been.calledWith(['foo']);
                });
            });
            it('should update the flag after operations complete', function () {
                return strategy.reset(rs).then(function () {
                    expect(saveStub).to.have.been.calledOnce;
                    expect(saveStub).to.have.been.calledWith({ foo: 'bar' });
                });
            });
            it('should return the merged runobject back', function () {
                return strategy.reset(rs).then(function (run) {
                    expect(run).to.eql({
                        id: 'x',
                        foo: 'bar',
                    });
                });
            });
        });
    });
}());