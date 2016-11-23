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

    var server;
    var runs = [{
        id: '1',
    }];
    var setupResponse = function (verb, endpoint, statusCode, resp, respHeaders) {
        server.respondWith(verb, endpoint, function (xhr, id) {
            var headers = _.extend({}, { 'Content-Type': 'application/json' }, respHeaders);
            var body = typeof resp === 'object' ? JSON.stringify(resp) : resp;
            xhr.respond(statusCode, headers, body);
        });
    };


    var setupServer = function () {
        server = sinon.fakeServer.create();
        setupResponse('GET', /run\/forio-dev\/js-libs/, 200, runs || []);
        server.respondImmediately = true;
    };

    var teardownServer = function () {
        server.restore();
    };

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };

    describe('Conditional Creation Strategy', function () {
        beforeEach(function () {
            setupServer();
        });

        afterEach(function () {
            teardownServer();
        });

        function createRunManager(options) {
            var rm = new F.manager.RunManager(_.extend({
                strategy: 'always-new',
                run: {
                    model: 'model.eqn'
                }
            }, options));

            rm.strategy._auth = fakeAuth;

            return rm;
        }

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

                var dummyRunid = 'foo';
                var dummySessionStore = {
                    getStore: function () {
                        return {
                            get: function () { 
                                return JSON.stringify({
                                    runId: dummyRunid
                                });
                            },
                            set: function () { },
                        };
                    }
                };

                it('should try to load it', function () {
                    var rm = new Strategy(true, {
                        run: rs
                    });
                    rm._auth = fakeAuth;
                    rm.sessionManager = dummySessionStore;
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
                        rm.sessionManager = dummySessionStore;
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
                        rm.sessionManager = dummySessionStore;
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