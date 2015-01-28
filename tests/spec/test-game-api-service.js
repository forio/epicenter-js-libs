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
                createGameService().create({ model: 'model_file', group: 'group-name' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
                body.account.should.equal('forio');
                body.project.should.equal('js-libs');
                body.group.should.equal('group-name');
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

        describe('delete', function () {
            it('should call DELETE on the API with the correct Game ID', function () {
                createGameService({ filter: 'gameid1' }).delete();
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                /\/game\/gameid1/.test(req.url).should.be.true;
            });
        });

        describe('list', function () {
            it('should call GET on the Game API with an account and project', function () {
                createGameService({ group: '123' }).list();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/game\//.test(req.url).should.be.true;
                /group=123/.test(req.url).should.be.true;
                /account=forio/.test(req.url).should.be.true;
                /project=js-libs/.test(req.url).should.be.true;
            });
        });

        describe('getGamesForUser', function () {
            it('should call GET on the GameAPI with the user paramter', function () {
                createGameService({ group: '123' })
                    .getGamesForUser({ userId: 'abc999' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/game\//.test(req.url).should.be.true;
                /group=123/.test(req.url).should.be.true;
                /account=forio/.test(req.url).should.be.true;
                /project=js-libs/.test(req.url).should.be.true;
                /userId=abc999/.test(req.url).should.be.true;
            });
        });

        describe('addUsers', function () {
            it('should POST to the Game API users end point with the correct params', function () {
                var users = [{ userId: '1', role: 'a' }];

                createGameService({ filter: 'gameid1' }).addUsers(users);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                /\/game\/gameid1/.test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);

                body.should.be.instanceof(Array);
                body.should.be.length(1);
                body.should.be.eql(users);
            });

            it('should take the gameId from the service options or the override options', function () {
                createGameService().addUsers([{ userId: '1', role: '1' }], { filter: 'gameid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/game\/gameid1\/users/);
            });
        });

        describe('removeUser', function () {
            it('should call DELETE on the Game API users end point', function () {
                createGameService({ filter: 'gameid1' }).removeUser({ userId: '123' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/game\/gameid1\/users\/123/);
            });

            it('should take the gameId from the service options or the override options', function () {
                createGameService().removeUser({ userId: '123' }, { filter: 'gameid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/game\/gameid1\/users/);
            });
        });

        describe('getCurrentRun', function () {
            it('should POST to the Game APIs run end point', function () {
                createGameService({ filter: 'gameid1' }).getCurrentRun();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/game\/gameid1\/run/);
            });

            it('should take the gameId from the service options or the override options', function () {
                createGameService().getCurrentRun({ filter: 'gameid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/game\/gameid1\/run/);
            });
        });
    });

})();