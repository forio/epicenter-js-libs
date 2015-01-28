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

        function createGameService(options) {
            return new GameService(_.extend({
                account: 'forio',
                project: 'js-libs'
            }, options));
        }

        describe('create', function () {
            it('POST to game API with the correct parameters (account, project and model)', function () {
                createGameService().create({ model: 'model_file' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
                body.account.should.equal('forio');
                body.project.should.equal('js-libs');
            });

            it('should pass the optional parameters to the API', function () {
                var params = { model: 'model_file', roles: ['role1', 'role2'], optionalRoles: ['observer'], minUsers: 2 };
                createGameService().create(params);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.model.should.equal(params.model);
                body.roles.should.eql(params.roles);
                body.optionalRoles.should.eql(params.optionalRoles);
                body.minUsers.should.equal(params.minUsers);
            });

            it('should accept a string as the model parameter', function () {
                createGameService().create('model_file');

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
            });

            it('should pass the new game reponse to the callback', function (done) {
                createGameService().create({ model: 'model_file' })
                    .then(function (resp) {
                        resp.newGame.should.equal(true);
                        done();
                    });
            });
        });

        describe('update', function () {
            it('should call the PATCH API with the correct Game Id', function () {
                var gs = createGameService({ filter: 'abc1' });
                gs.update({ roles: ['role1'] });
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
                /\/game\/abc1/.test(req.url).should.be.true;
            });

            it('should trow if no filter is specified', function () {
                var gs = createGameService();
                var ret = function () { gs.update({ roles: ['a'] }); };

                ret.should.throw(Error);
            });

            it('should only pass whitelisted parameters', function () {
                var gs = createGameService({ filter: 'abc1' });
                var params = { other: 'other', roles: ['role1'], optionalRoles: ['role2'], minUsers: 4 };

                gs.update(params);

                var req = server.requests.pop();

                var body = JSON.parse(req.requestBody);
                body.roles.should.be.eql(params.roles);
                body.optionalRoles.should.be.eql(params.optionalRoles);
                body.minUsers.should.be.equal(params.minUsers);

                expect(body.other).to.be.undefined;
            });
        });
    });

})();