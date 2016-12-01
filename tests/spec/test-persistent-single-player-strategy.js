(function () {
    'use strict';

    var Strategy = F.manager.strategy['persistent-single-player'];
    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };


    var cookieContents = {
        auth_token: '',
        account: 'forio-dev',
        project: 'js-libs',
        userId: '123',
        groupId: 'group123',
        groupName: 'group-123',
        isFac: false
    };

    var runs = [{
        id: '1',
    }];

    var fakeAuth = {
        // get should return what's stoed in the session cookie
        getCurrentUserSessionInfo: sinon.stub().returns(cookieContents)
    };

    var server;

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
        setupResponse('GET', /run\/forio-dev\/js-libs\/1/, 200, runs[0] || []);

        server.autorespond = true;
    };

    var teardownServer = function () {
        server.restore();
    };

    describe('Persistent Single Player strategy', function () {

        before(function () {
            setupServer();
        });

        after(function () {
            teardownServer();
        });

        beforeEach(function () {
        });

        afterEach(function () {
        });

        function createRunManager(options) {
            var rm = new F.manager.RunManager(_.extend({
                strategy: 'persistent-single-player',
                run: {
                    account: cookieContents.account,
                    project: cookieContents.project,
                    model: 'model.eqn'
                }
            }, options));

            rm.strategy._auth = fakeAuth;

            return rm;
        }

        describe('getRun', function () {
            it('should GET all current runs for user in the group', function () {
                createRunManager().getRun();

                var req = server.requests.pop();
                expect(req.method).to.equal('GET');
                expect(req.url).match(/(user.id=(.*)|scope.group=(.*))/);
            });
        });

        describe.only('#reset', function () {
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
                return rm.reset(rs, {}).then(function () {
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