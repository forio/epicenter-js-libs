
import RunManager from 'managers/run-manager';
import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

import { partial } from 'lodash';

describe('Multiplayer strategy', function () {
    var cookieContents = {
        auth_token: '',
        account: 'forio-dev',
        project: 'js-libs',
        userId: '123',
        groupId: 'group123',
        groupName: 'group-123',
        isFac: false
    };

    var queryMatchers = {
        worldEndpoint: /multiplayer\/world/i,
        getWorlds: /multiplayer\/world\/\?((?:project=js-libs|account=forio-dev|group=group-123|&userId=123)&?){4}/gi,
    };

    var server;

    var setupResponse = function (verb, endpoint, statusCode, resp, respHeaders) {
        server.respondWith(verb, endpoint, function (xhr, id) {
            var ct = typeof resp === 'string' ? {} : { 'Content-Type': 'application/json' };
            var headers = Object.assign({}, ct, respHeaders);
            var body = typeof resp === 'object' ? JSON.stringify(resp) : resp;
            xhr.respond(statusCode, headers, body);
        });
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

    var setupServer = function (worlds) {
        server = sinon.fakeServer.create();
        server.respondWith('GET', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            return true;
        });
        setupResponse('GET', queryMatchers.worldEndpoint, 200, worlds || []);
        setupResponse('POST', /multiplayer\/world\/worldid1\/run/, 201, 'run1');
        setupResponse('POST', /multiplayer\/world\/worldid2\/run/, 201, 'run2');

        server.respondImmediately = true;
    };

    var teardownServer = function () {
        server.restore();
    };
    
    beforeEach(partial(setupServer, worldSet));
    afterEach(teardownServer);

    function createRunManager(options) {
        var rm = new RunManager(Object.assign({
            strategy: 'multiplayer',
            run: {
                account: 'forio-dev',
                project: 'js-libs',
                model: 'model_file'
            }
        }, options));
        sinon.stub(rm.sessionManager, 'getSession').returns(cookieContents);
        return rm;
    }

    describe('with world/users setup correctly', function () {
        it('should get the list of worlds for the current user first', function () {
            return createRunManager().getRun().then(function () {
                var req = server.requests[0];
                req.method.toUpperCase().should.equal('GET');
                req.url.should.match(queryMatchers.getWorlds);
            });
        });

        it('should post to the run endpoint after getting the world', function () {
            return createRunManager().getRun().then(function () {
                var req = server.requests[1];
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/multiplayer\/world\/worldid2\/run/);
            });
        });
    });

    describe('with two worlds for the user', function () {
        it('should use the latest world to retore the run', function () {
            return createRunManager().getRun().then(function () {
                var req = server.requests[1];
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/multiplayer\/world\/worldid2/);
            });
        });
    });

    describe('when user is not in any world', function () {
        beforeEach(partial(setupServer, []));
        it('should fail the getRun request with proper error', function () {
            var callback = sinon.spy();
            return createRunManager().getRun()
                .then(null, callback)
                .then(function () {
                    callback.called.should.be.true;
                });
        });
    });
    describe('#reset', function () {
    });
});
