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
            var rs, createStub, filterStub, loadStub, rm; //eslint-disable-line
            beforeEach(function () {
                rs = new F.service.Run(runOptions);
                createStub = sinon.stub(rs, 'create', function () {
                    return $.Deferred().resolve({
                        id: 'def'
                    }).promise();
                });
                filterStub = sinon.stub(rs, 'filter', function () {
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
                    options.success({ id: runid }, null);
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                rm = new Strategy();
            });
            it('should query for all runs in group', function () {
                return rm.getRun(rs, auth).then(function () {
                    expect(filterStub).to.have.been.calledOnce;
                    var args = filterStub.getCall(0).args;
                    
                    expect(args[0]).to.eql({
                        'user.id': auth.userId,
                        'scope.group': auth.groupName
                    });
                });
            });
            it('should create new if not runs available', function () {
                var rs = new F.service.Run(runOptions);
                sinon.stub(rs, 'filter', function () {
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