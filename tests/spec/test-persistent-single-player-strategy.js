(function () {
    'use strict';

    var Strategy = F.manager.strategy['persistent-single-player'];
    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };
    var auth = {
        userId: 'user1',
        groupName: 'groupName'
    };

    describe('Persistent Single Player strategy', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/state\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondImmediately = true;
        });

        after(function () {
            server.restore();
        });

        describe('getRun', function () {
            var rs, createStub, queryStub, loadStub, rm;
            beforeEach(function () {
                var sucessHeader = {
                    getResponseHeader: function () {
                        return 'persistent';
                    }
                };
                var falseHeader = {
                    getResponseHeader: function () {
                        return 'sdfs';
                    }
                };
                rs = new F.service.Run(runOptions);
                createStub = sinon.stub(rs, 'create', function () {
                    return $.Deferred().resolve({
                        id: 'def'
                    }).promise();
                });
                queryStub = sinon.stub(rs, 'query', function () {
                    return $.Deferred().resolve([
                        {
                            id: 'run1',
                            date: '2016-10-21T00:07:55.735Z'
                        }, {
                            id: 'run2',
                            date: '2014-10-21T00:07:55.735Z'
                        }
                    ]).promise();
                });
                loadStub = sinon.stub(rs, 'load', function (runid, filters, options) {
                    options.success({ id: runid }, null, falseHeader);
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                rm = new Strategy();
            });
            it('should reject if no usersession is passed in', function () {
                var successSpy = sinon.spy();
                var failSpy = sinon.spy();

                return rm.getRun(rs).then(successSpy).catch(failSpy).then(function () {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.calledOnce;
                });
            });
            it('should query for all runs in group', function () {
                return rm.getRun(rs, auth).then(function () {
                    expect(queryStub).to.have.been.calledOnce;
                    var args = queryStub.getCall(0).args;
                    
                    expect(args[0]).to.eql({
                        'user.id': auth.userId,
                        'scope.group': auth.groupName
                    });
                });
            });
            it('should create new if not runs available', function () {
                var rs = new F.service.Run(runOptions);
                var queryStub = sinon.stub(rs, 'query', function () {
                    return $.Deferred().resolve([]);
                });
                var createStub = sinon.stub(rs, 'create', function () {
                    return $.Deferred().resolve({
                        id: 'def'
                    }).promise();
                });
                return rm.getRun(rs, auth).then(function () {
                    expect(createStub).to.have.been.calledOnce;
                });
            });
        });

        describe('#reset', function () {
            var rs, createStub, rm;
            beforeEach(function () {
                rs = new F.service.Run(runOptions);
                createStub = sinon.stub(rs, 'create', function () {
                    return $.Deferred().resolve({
                        id: 'def'
                    }).promise();
                });
                rm = new Strategy();
            });
            it('should reject if no usersession is passed in', function () {
                var successSpy = sinon.spy();
                var failSpy = sinon.spy();

                return rm.reset(rs).then(successSpy).catch(failSpy).then(function () {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.calledOnce;
                });
            });
            it('should call runservice.create', function () {
                return rm.reset(rs, { groupName: 'group-123' }).then(function () {
                    expect(createStub).to.have.been.calledOnce;
                });
            });
            it('should pass in the right auth params', function () {
                return rm.reset(rs, { groupName: 'group-123' }).then(function () {
                    var args = createStub.getCall(0).args;
                    expect(args[0].scope).to.eql({ group: 'group-123' });
                });
            });
        });
    });
}());