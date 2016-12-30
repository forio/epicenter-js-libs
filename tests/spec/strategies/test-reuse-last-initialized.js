(function () {
    'use strict';

    var Strategy = F.manager.strategy['reuse-last-initialized'];
    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };
    var auth = {
        userId: 'user1',
        groupName: 'groupName'
    };
        
    describe.only('Reuse last initialized', function () {
        describe('Options', function () {
            it('should throw an error if no options provided', function () {
                var c = function () { new Strategy(); };
                expect(c).to.throw(Error);
            });
        }); 

        describe('#getRun', function () {
            var rs, strategy, resetStub;
            beforeEach(function () {
                rs = new F.service.Run(runOptions);
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
                var filterstub = sinon.stub(rs, 'filter').returns($.Deferred().resolve([]).promise());

                return strategy.getRun(rs).then(function () {
                    expect(filterstub).to.have.been.calledWith({
                        foo: 'bar'
                    });
                });
            });
            it('should filter by groupname if provided', function () {
                
            });
            it('should filter by username if provided', function () {
                
            });
            it('should call reset if not found', function () {
                
            });
            it('should return the run if found', function () {
                
            });
        });
        describe('#reset', function () {
            it('should create a new run', function () {
                
            });
            it('should call `serial` on the new run with the new operations', function () {
                
            });
            it('should update the flag after operations complete', function () {
                
            });
        });
    });
}());