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

    describe.only('Run Manager', function () {
        describe('#run', function () {
            it('creates a run member property if passed in run options', function () {
                var rm = new F.manager.RunManager({
                    strategy: 'always-new',
                    run: {
                        model: 'model.eqn',
                        account: 'forio-dev',
                        project: 'js-libs',
                    }
                });
                expect(rm.run).to.be.instanceof(F.service.Run);
            });
            it('creates a run member property if passed in a runservice', function () {
                var rs = new F.service.Run({
                    model: 'model.eqn',
                    account: 'forio-dev',
                    project: 'js-libs',
                });
                var rm = new F.manager.RunManager({
                    strategy: 'always-new',
                    run: rs
                });
                expect(rm.run).to.be.instanceof(F.service.Run);
            });
        });
    });

}());