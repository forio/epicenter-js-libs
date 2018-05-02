import WorldManager from '../index';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

var cookieContents = {
    auth_token: '',
    account: 'forio',
    project: 'js-libs',
    userId: 'user-123',
    groupId: 'group321',
    groupName: 'group-321',
    isFac: false
};

var fakeAuth = {
    // get should return what's stoed in the session cookie
    getCurrentUserSessionInfo: sinon.stub().returns(cookieContents)
};


var worldSet = [{
    id: 'worldid1',
    lastModified: new Date(2014, 1, 1),
    run: 'run1',
    users: [{
        userId: '123', userName: 'userName', index: 0
    }]
}, {
    id: 'worldid2',
    lastModified: new Date(2015, 1, 1),
    run: 'run2',
    users: [{
        userId: '123', userName: 'userName', index: 0
    }]
}];

describe('World Manager', function () {
    var server;
    before(function () {
        server = sinon.fakeServer.create();
        var getworldsPattern = /multiplayer\/world\/\?((?:project=js-libs|account=forio|group=group-321|&userId=user-123)&?){4}/;

        // get & load runId
        server.respondWith('POST', /\/world\/worldid2\/run/, function (xhr) {
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(worldSet[1].run));

        });

        // get worlds
        server.respondWith('GET', getworldsPattern, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(worldSet));
        });

        // get worlds wrong parameters
        server.respondWith('GET', /multiplayer\/world\/.*((?:project=(?!js-libs)))/, function (xhr) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify([]));
        });

        // get run header
        server.respondWith('GET', /run\/forio\/js-libs\/run2/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({
                id: 'run2',
                lastModified: '123'
            }));
        });
        server.respondImmediately = true;
    });

    afterEach(function () {
        server.requests = [];
    });
    after(function () {
        server.restore();
    });

    function createWorldManager(options) {
        var wm = new WorldManager(Object.assign({}, {
            account: 'forio',
            project: 'js-libs',
            group: 'group-123',
            model: 'model_file'
        }, options));

        wm._auth = fakeAuth;

        return wm;
    }

    describe('constructor', function () {
        it('should take options at the top level of the options object', function () {
            var options = {
                account: 'forio',
                project: 'js-libs',
                group: 'group-321',
                model: 'sdfds.vmf',
            };

            var wm = new WorldManager(options);
            wm._auth = fakeAuth;

            wm.getCurrentRun();

            // we need to check that the correct options are passed to the run
            var req = server.requests[0];
            req.method.toUpperCase().should.equal('GET');
            req.url.should.match(/\/world\//);
            req.url.should.match(/group=group-321/);
            req.url.should.match(/account=forio/);
            req.url.should.match(/project=js-libs/);
            req.url.should.match(/userId=user-123/);

        });

        it('should allow to override run options with a nested run object in the main options object', function () {
            var options = {
                account: 'forio',
                project: 'js-libs',
                run: {
                    account: 'other-account',
                },
                world: {
                    project: 'other-project',
                }
            };

            var wm = new WorldManager(options);
            wm._auth = fakeAuth;

            wm.getCurrentRun();

            // we need to check that the correct options are passed to the run
            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            req.url.should.match(/\/world\//);
            req.url.should.match(/group=group-321/);
            req.url.should.match(/account=other-account/);
            req.url.should.match(/project=other-project/);
            req.url.should.match(/userId=user-123/);
        });
    });

    describe('getCurrentRun', function (done) {
        it('should return the current run object and runService of the run of the current world', function (done) {
            createWorldManager().getCurrentRun('model.py')
                .then(function (run) {
                    run.should.not.be.null;
                    run.id.should.be.equal('run2');
                    done();
                })
                .fail(function () {
                    done(new Error('error'));
                });
        });

        it('should throw if user is not part of any world', function (done) {
            createWorldManager({ project: 'other' }).getCurrentRun('model.py')
                .fail(function (msg) {
                    expect(msg.error).to.not.be.null;
                    done();
                });
        });
    });

    describe('getCurrentWorld', function () {
        it('should GET through the API with correct parameters for account, project, group and user', function () {
            createWorldManager().getCurrentWorld('user-123', 'group-321');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            req.url.should.match(/\/world\//);
            req.url.should.match(/group=group-321/);
            req.url.should.match(/account=forio/);
            req.url.should.match(/project=js-libs/);
            req.url.should.match(/userId=user-123/);
        });

        it('should return the latest world object in the promise', function (done) {
            createWorldManager().getCurrentWorld('user-123', 'group-321')
                .then(function (world) {
                    world.should.not.be.null;
                    world.id.should.be.equal('worldid2');
                    done();
                })
                .fail(function () {
                    done('error');
                });
        });

    });
});
