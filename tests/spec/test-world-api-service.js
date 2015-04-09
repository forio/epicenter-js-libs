(function () {
    'use strict';

    describe('World API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('POST', /(.*)\/world/, function (xhr, id) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({ newWorld: true }));
            });
            server.respondWith('DELETE', /(.*)\/world/, function (xhr, id) {
                xhr.respond(204, { 'Content-Type': 'application/json' }, null);
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
            it('POST to world API with the correct parameters (account, project and model)', function () {
                createWorldAdapter().create({ group: 'group-name' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.account.should.equal('forio');
                body.project.should.equal('js-libs');
                body.group.should.equal('group-name');
            });

            it('should pass the optional parameters to the API', function () {
                var params = { roles: ['role1', 'role2'], optionalRoles: ['observer'], minUsers: 2 };
                createWorldAdapter().create(params);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                body.roles.should.eql(params.roles);
                body.optionalRoles.should.eql(params.optionalRoles);
                body.minUsers.should.equal(params.minUsers);
            });

            it('should pass the new world reponse to the callback', function (done) {
                createWorldAdapter().create()
                    .then(function (resp) {
                        resp.newWorld.should.equal(true);
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
                /\/world\/abc1/.test(req.url).should.be.true;
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
                createWorldAdapter({ filter: 'worldid1' }).delete();
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                /\/world\/worldid1/.test(req.url).should.be.true;
            });
        });

        describe('list', function () {
            it('should call GET on the world API with an account and project', function () {
                createWorldAdapter({ group: '123' }).list();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/world\//.test(req.url).should.be.true;
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
                /\/world\//.test(req.url).should.be.true;
                /group=123/.test(req.url).should.be.true;
                /account=forio/.test(req.url).should.be.true;
                /project=js-libs/.test(req.url).should.be.true;
                /userId=abc999/.test(req.url).should.be.true;
            });
        });

        describe('addUsers', function () {
            it('should POST to the world API users end point with the correct params', function () {
                var users = [{ userId: '1', role: 'a' }];

                createWorldAdapter({ filter: 'worldid1' }).addUsers(users);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                /\/world\/worldid1/.test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);

                body.should.be.instanceof(Array);
                body.should.be.length(1);
                body.should.be.eql(users);
            });

            it('should take the worldid from the service options or the override options', function () {
                createWorldAdapter().addUsers([{ userId: '1', role: '1' }], { filter: 'worldid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/world\/worldid1\/users/);
            });
        });

        describe('removeUser', function () {
            it('should call DELETE on the world API users end point', function () {
                createWorldAdapter({ filter: 'worldid1' }).removeUser('123');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/world\/worldid1\/users\/123/);
            });

            it('should take the worldid from the service options or the override options', function () {
                createWorldAdapter().removeUser({ userId: '123' }, { filter: 'worldid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/world\/worldid1\/users/);
            });
        });

        describe('getCurrentRunId', function () {
            it('should take the model file from the service options', function () {
                createWorldAdapter({ filter: 'worldid1', model: 'model_file' }).getCurrentRunId();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/world\/worldid1\/run/);
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
            });

            it('should POST to the world APIs run end point', function () {
                createWorldAdapter({ filter: 'worldid1' }).getCurrentRunId({ model: 'model_file' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/world\/worldid1\/run/);
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
            });

            it('should take the worldid from the service options or the override options', function () {
                createWorldAdapter().getCurrentRunId({ model: 'model_file', filter: 'worldid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/world\/worldid1\/run/);
                var body = JSON.parse(req.requestBody);
                body.model.should.equal('model_file');
            });

            it('should throw an error if no model is supplied.', function () {
                var adapter = createWorldAdapter();
                var operation = function () {
                    adapter.getCurrentRunId({ filter: 'worldid1' });
                };

                operation.should.throw(Error);
            });
        });

        describe('newRunForWorld', function () {
            it('should throw an error if no model is supplied.', function () {
                var adapter = createWorldAdapter();
                var operation = function () {
                    adapter.newRunForWorld({ filter: 'worldid1' });
                };

                operation.should.throw(Error);
            });
        });
    });

})();