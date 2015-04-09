(function () {
    'use strict';

    var cookieContents = {
        'auth_token': '',
        'account': 'forio-dev',
        'project': 'js-libs',
        'userId': '123',
        'groupId': 'group123',
        'groupName': 'group-123',
        'isFac': false
    };

    var queryMatchers = {
        worldEndpoint: /multiplayer\/world/i,
        getWorlds: /multiplayer\/world\/\?((?:project=js-libs|account=forio-dev|group=group\-123|&userId=123)&?){4}/gi,
    };

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

    var worldSet = [{
        id: 'worldid1',
        lastModified: new Date(2014,1,1),
        run: 'run1',
        users: [{
            userId: '123', userName: 'userName', index: 0
        }]
    }, {
        id: 'worldid2',
        lastModified: new Date(2015,1,1),
        run: 'run2',
        users: [{
            userId: '123', userName: 'userName', index: 0
        }]
    }];

    var setupServer = function (worlds) {
        server = sinon.fakeServer.create();

        setupResponse('GET', queryMatchers.worldEndpoint, 200, worlds || []);

        setupResponse('POST', /multiplayer\/world\/worldid1\/run/, 201, 'run1');
        setupResponse('POST', /multiplayer\/world\/worldid2\/run/, 201, 'run2');

        server.autorespond = true;
    };

    var teardownServer = function () {
        server.restore();
    };



    describe('Multiplayer strategy', function () {
        beforeEach(_.partial(setupServer, worldSet));
        afterEach(teardownServer);


        function createRunManager(options) {
            var rm = new F.manager.RunManager(_.extend({
                strategy: 'multiplayer',
                run: {
                    account: 'forio-dev',
                    project: 'js-libs',
                    model: 'model_file'
                }
            }, options));

            // this is briddle, it knows too much about the internals of the run manager
            // but replace the cookie store with a stub
            rm.strategy._auth = fakeAuth;

            return rm;
        }

        describe('with world/users setup correctly', function () {
            it('should get the list of worlds for the current user first', function () {
                createRunManager().getRun();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');

                req.url.should.match(queryMatchers.getWorlds);
            });

            it('should post to the run endpoint after getting the world', function () {
                createRunManager().getRun();

                server.respond();
                var req = server.requests.pop();

                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/multiplayer\/world\/worldid2\/run/);

            });
        });

        describe('with two worlds for the user', function () {
            it('should use the latest world to retore the run', function () {
                createRunManager().getRun();

                server.respond();
                var req = server.requests.pop();

                req.method.toUpperCase().should.equal('POST');

                req.url.should.match(/multiplayer\/world\/worldid2/);
            });
        });

        describe('when user is not in any world', function () {
            beforeEach(_.partial(setupServer, []));
            it('should fail the getRun request with proper error', function () {
                var callback = sinon.spy();
                createRunManager().getRun()
                    .fail(callback);

                server.respond();

                callback.called.should.be.true;
            });
        });

    });
})();
