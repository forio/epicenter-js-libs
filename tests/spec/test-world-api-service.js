(function () {
    'use strict';

    describe('World API Service', function () {
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

        function createWorldAdapter(options) {
            return new F.service.World(_.extend({
                account: 'forio',
                project: 'js-libs'
            }, options));
        }

        describe('create', function () {
            it('should POST to world API with the correct parameters (account, project and model)', function () {
                createWorldAdapter().create({ model: 'model_file', group: 'group-name' });

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
                createWorldAdapter().create(params);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.model.should.equal(params.model);
                body.roles.should.eql(params.roles);
                body.optionalRoles.should.eql(params.optionalRoles);
                body.minUsers.should.equal(params.minUsers);
            });

            it('should accept a string as the model parameter', function () {
                createWorldAdapter().create('model_file');

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
            });

            it('should accept group in the constructor ', function () {
                var params = { model: 'model_file' };
                createWorldAdapter({ group: 'group-name1' }).create(params);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                expect(body.group).to.equal('group-name1');
            });

            it('should accept group in the create call', function () {
                var params = { model: 'model_file', group: 'group-in-create' };
                createWorldAdapter().create(params);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                expect(body.group).to.equal('group-in-create');
            });

            it('should pass the new world reponse to the callback', function (done) {
                createWorldAdapter().create({ model: 'model_file' })
                    .then(function (resp) {
                        resp.newGame.should.equal(true);
                        done();
                    });
            });
        });

        describe('update', function () {
            it('should call the PATCH API with the correct World Id', function () {
                var gs = createWorldAdapter({ filter: 'abc1' });
                gs.update({ roles: ['role1'] });
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
                /\/game\/abc1/.test(req.url).should.be.true;
            });

            it('should trow if no filter is specified', function () {
                var gs = createWorldAdapter();
                var ret = function () { gs.update({ roles: ['a'] }); };

                ret.should.throw(Error);
            });

            it('should only pass whitelisted parameters', function () {
                var gs = createWorldAdapter({ filter: 'abc1' });
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
            it('should call DELETE on the API with the correct World ID', function () {
                createWorldAdapter({ filter: 'gameid1' }).delete();
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                /\/game\/gameid1/.test(req.url).should.be.true;
            });
        });

        describe('list', function () {
            it('should call GET on the world API with an account and project', function () {
                createWorldAdapter({ group: '123' }).list();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/game\//.test(req.url).should.be.true;
                /group=123/.test(req.url).should.be.true;
                /account=forio/.test(req.url).should.be.true;
                /project=js-libs/.test(req.url).should.be.true;
            });
        });

        describe('getWorldsForUser', function () {
            it('should call GET on the World API with the user paramter', function () {
                createWorldAdapter({ group: '123' })
                    .getWorldsForUser('abc999');

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
            it('should POST to the world API users end point with the correct params', function () {
                var users = [{ userId: '1', role: 'a' }];

                createWorldAdapter({ filter: 'gameid1' }).addUsers(users);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                /\/game\/gameid1/.test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);

                body.should.be.instanceof(Array);
                body.should.be.length(1);
                body.should.be.eql(users);
            });

            it('should accept a single user object and pass an array to the API call', function () {
                var user = { userId: 'user1', role: 'abc' };
                createWorldAdapter({ filter: 'gameid1' }).addUsers(user);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                /\/game\/gameid1/.test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);
                body.should.be.instanceof(Array);
                body.should.be.length(1);
                body.should.be.eql([user]);

            });

            it('should accept a string with the userId and pass an array to the API call', function () {
                createWorldAdapter({ filter: 'gameid1' }).addUsers('user1');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                /\/game\/gameid1/.test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);
                body.should.be.instanceof(Array);
                body.should.be.length(1);
                body.should.be.eql([{ userId: 'user1' }]);

            });

            it('should accept an array of string userIds and pass an array of objects to API call', function () {
                createWorldAdapter({ filter: 'gameid1' }).addUsers(['user1', 'user2']);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                /\/game\/gameid1/.test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);
                body.should.be.instanceof(Array);
                body.should.be.length(2);
                body.should.be.eql([{ userId: 'user1' }, { userId: 'user2' }]);

            });

            it('should take the worldId as the second parameter if its a string', function () {
                createWorldAdapter().addUsers([{ userId: '1', role: '1' }], 'gameid1');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/game\/gameid1\/users/);

            });

            it('should take the gameId from the service options or the override options', function () {
                createWorldAdapter().addUsers([{ userId: '1', role: '1' }], { filter: 'gameid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/game\/gameid1\/users/);
            });

            it('should throw error if no users are specified', function () {
                var ws = createWorldAdapter();

                expect(ws.addUsers).to.throw(Error);
            });

            it('should throw error if not all users in the list are valid', function () {
                var ws = createWorldAdapter();
                var fn = _.partial(ws.addUsers, ['123', { userId: '532' }, 123]);

                expect(fn).to.throw(Error);
            });
        });

        describe('removeUser', function () {
            it('should call DELETE on the world API users end point', function () {
                createWorldAdapter({ filter: 'gameid1' }).removeUser('123');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/game\/gameid1\/users\/123/);
            });

            it('should take the gameId from the service options or the override options', function () {
                createWorldAdapter().removeUser({ userId: '123' }, { filter: 'gameid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/game\/gameid1\/users\/123/);
            });
        });

        describe('updateUser', function () {
            it('should patch the correct user for the correct world', function () {
                createWorldAdapter({ filter: 'gameid1' }).updateUser({ userId:'123', role: 'abc' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
                req.url.should.match(/\/game\/gameid1\/users\/123/);
            });

            it('should patch the correct role', function () {
                createWorldAdapter({ filter: 'gameid1' }).updateUser({ userId:'123', role: 'abc' });

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                body.should.eql({ role: 'abc' });
            });

        });

        describe('getCurrentRunId', function () {
            it('should POST to the world APIs run end point', function () {
                createWorldAdapter({ filter: 'gameid1' }).getCurrentRunId();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/game\/gameid1\/run/);
            });

            it('should take the gameId from the service options or the override options', function () {
                createWorldAdapter().getCurrentRunId({ filter: 'gameid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/game\/gameid1\/run/);
            });
        });

    });

})();