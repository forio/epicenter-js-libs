(function () {
    'use strict';

    var GameService = F.service.Game;

    describe('Game API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('POST', /(.*)\/game/, function (xhr, id) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({ newGame: true }));
            });

            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        describe('create', function () {
            it('POST to game API with the correct parameters (account, project and model)', function () {
                var gs = new GameService({ account: 'forio', project: 'js-libs' });
                gs.create({ model: 'model_file' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
                body.account.should.equal('forio');
                body.project.should.equal('js-libs');
            });

            it('should pass the optional parameters to the API', function () {
                var gs = new GameService({ account: 'forio', project: 'js-libs' });
                var params = { model: 'model_file', roles: ['role1', 'role2'], optionalRoles: ['observer'], minUsers: 2 };
                gs.create(params);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.model.should.equal(params.model);
                body.roles.should.eql(params.roles);
                body.optionalRoles.should.eql(params.optionalRoles);
                body.minUsers.should.equal(params.minUsers);

            });


            it('should accept a string as the model parameter', function () {
                var gs = new GameService({ account: 'forio', project: 'js-libs' });
                gs.create('model_file');

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
            });

            it('should pass the new game reponse to the callback', function (done) {
                var gs = new GameService({ account: 'forio', project: 'js-libs' });
                gs.create({ model: 'model_file' })
                    .then(function (resp) {
                        resp.newGame.should.equal(true);
                        done();
                    });
            });
        });
    });

})();