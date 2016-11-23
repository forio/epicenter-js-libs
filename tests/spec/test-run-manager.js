(function () {
    'use strict';

    // var cookieContents = {
    //     auth_token: '',
    //     account: 'forio-dev',
    //     project: 'js-libs',
    //     userId: '123',
    //     groupId: 'group123',
    //     groupName: 'group-123',
    //     isFac: false
    // };

    // var runs = [{
    //     id: '1',
    // }];

    // var fakeAuth = {
    //     // get should return what's stoed in the session cookie
    //     getCurrentUserSessionInfo: sinon.stub().returns(cookieContents)
    // };

    // var server;

    // var setupResponse = function (verb, endpoint, statusCode, resp, respHeaders) {
    //     server.respondWith(verb, endpoint, function (xhr, id) {
    //         var headers = _.extend({}, { 'Content-Type': 'application/json' }, respHeaders);
    //         var body = typeof resp === 'object' ? JSON.stringify(resp) : resp;
    //         xhr.respond(statusCode, headers, body);
    //     });
    // };


    // var setupServer = function () {
    //     server = sinon.fakeServer.create();
    //     setupResponse('GET', /run\/forio-dev\/js-libs/, 200, runs || []);
    //     server.respondImmediately = true;
    // };

    // var teardownServer = function () {
    //     server.restore();
    // };
    
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
                    expect(function () { new F.manager.RunManager({ strategy: 'booya' }); }).to.throw(Error);
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
            it('should call the strategy\'s getRun', function () {
                var getRunSpy = sinon.spy();
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
                var getRunSpy = sinon.spy();
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
                // expect(getRunSpy).to.have.been.calledOnce;
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
                // expect(resetSpy.getCall(0).args[0]).to.equal(runOptions);
                expect(resetSpy.getCall(0).args[1]).to.be.instanceof(F.service.Run);
                // expect(getRunSpy).to.have.been.calledOnce;
            });
        });
    });

}());