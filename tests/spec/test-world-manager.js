(function () {
    'use strict';

    var cookieContents = {
        'auth_token': '',
        'account': 'forio',
        'project': 'js-libs',
        'userId': 'user-123',
        'groupId': 'group321',
        'groupName': 'group-321',
        'isFac': false
    };

    var fakeAuth = {
        // get should return what's stoed in the session cookie
        getUserSession: sinon.stub().returns(cookieContents)
    };


    var gameSet = [{
        id: 'gameId1',
        lastModified: new Date(2014,1,1),
        run: 'run1',
        users: [{
            userId: '123', userName: 'userName', index: 0
        }]
    }, {
        id: 'gameId2',
        lastModified: new Date(2015,1,1),
        run: 'run2',
        users: [{
            userId: '123', userName: 'userName', index: 0
        }]
    }];

    describe('World Manager', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            var getGamesPattern = /multiplayer\/game\/\?((?:project=js-libs|account=forio|group=group\-321|&userId=user\-123)&?){4}/;

            // get & load runId
            server.respondWith('POST', /\/game\/gameId2\/run/, function (xhr) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(gameSet[1].run));

            });

            // get games
            server.respondWith('GET', getGamesPattern, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(gameSet));
            });

            // get run header
            server.respondWith('GET',  /run\/forio\/js\-libs\/run2/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                    id: 'run2',
                    lastModified: '123'
                }));
            });



            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        function createWorldManager(options) {
            var wm = new F.manager.WorldManager(_.extend({
                account: 'forio',
                project: 'js-libs',
                group: 'group-123'
            }, options));

            wm._auth = fakeAuth;

            return wm;
        }

        describe('getCurrentRun', function (done) {
            it('should return the current run object and runService of the run of the current world', function (done) {
                createWorldManager().getCurrentRun()
                    .then(function (run, runService) {
                        run.should.not.be.null;
                        run.id.should.be.equal('run2');

                        runService.should.not.be.null;

                        done();
                    })
                    .fail(function () {
                        done(new Error('error'));
                    });
            });
        });

        describe('getCurrentWorld', function () {
            it('should GET through the API with correct parameters for account, project, group and user', function () {
                createWorldManager().getCurrentWorld('user-123', 'group-321');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                req.url.should.match(/\/game\//);
                req.url.should.match(/group=group\-321/);
                req.url.should.match(/account=forio/);
                req.url.should.match(/project=js-libs/);
                req.url.should.match(/userId=user\-123/);
            });

            it('should return the latest world object in the promise', function (done) {
                createWorldManager().getCurrentWorld('user-123', 'group-321')
                    .then(function (world) {
                        world.should.not.be.null;
                        world.id.should.be.equal('gameId2');
                        done();
                    })
                    .fail(function () {
                        done('error');
                    });
            });

        });
    });
})();