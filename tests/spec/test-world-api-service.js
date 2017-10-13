(function () {
    'use strict';
    var baseURL = (new F.service.URL()).getAPIPath('multiplayer/world');

    describe('World API Service', function () {
        var server;
        beforeEach(function () {
            server = sinon.fakeServer.create();
            server.respondWith('POST', /(.*)\/world/, function (xhr, id) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({ newWorld: true }));
            });
            server.respondWith('DELETE', /(.*)\/world/, function (xhr, id) {
                xhr.respond(204, { 'Content-Type': 'application/json' }, null);
            });

            server.respondImmediately = true;
        });

        afterEach(function () {
            server.restore();
        });

        function createWorldAdapter(options) {
            return new F.service.World(_.extend({
                account: 'forio',
                project: 'js-libs'
            }, options));
        }

        it('should allow specifying `id` instead of filter', function () {
            var ws = createWorldAdapter({ id: 'abc' });
            ws.load();

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'abc/');
        });

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
                var params = { name: 'world-1', roles: ['role1', 'role2'], optionalRoles: ['observer'], minUsers: 2 };
                createWorldAdapter().create(params);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                var body = JSON.parse(req.requestBody);
                expect(body.model).to.be.undefined;
                body.roles.should.eql(params.roles);
                body.optionalRoles.should.eql(params.optionalRoles);
                body.minUsers.should.equal(params.minUsers);
                body.name.should.equal(params.name);
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
                (/\/world\/abc1/).test(req.url).should.be.true;
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
                (/\/world\/worldid1/).test(req.url).should.be.true;
            });
            it('should interpret strings as an id', function () {
                createWorldAdapter().delete('worldid1');
                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                (/\/world\/worldid1/).test(req.url).should.be.true;
            });
        });

        describe('list', function () {
            it('should call GET on the world API with an account and project', function () {
                createWorldAdapter({ group: '123' }).list();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                (/\/world\//).test(req.url).should.be.true;
                (/group=123/).test(req.url).should.be.true;
                (/account=forio/).test(req.url).should.be.true;
                (/project=js-libs/).test(req.url).should.be.true;
            });
        });

        describe('#load()', function () {
            it('should do an GET', function () {
                var ws = createWorldAdapter({ filter: 'abc1' });
                ws.load();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });

            it('should take in a world id and query the server', function () {
                var ws = createWorldAdapter();
                ws.load('abc1');

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'abc1/');
            });
            it('should load a world without any filters if originally provided', function () {
                var ws = createWorldAdapter({ filter: 'abc1' });
                ws.load();

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'abc1/');
            });
            it('should throw an error if no worldid provide', function () {
                var ws = createWorldAdapter();
                var ret = function () { ws.load(); };
                ret.should.throw(Error);
            });
        });
        describe('getWorldsForUser', function () {
            it('should call GET on the World API with the user paramter', function () {
                createWorldAdapter({ group: '123' })
                    .getWorldsForUser('abc999');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                (/\/world\//).test(req.url).should.be.true;
                (/group=123/).test(req.url).should.be.true;
                (/account=forio/).test(req.url).should.be.true;
                (/project=js-libs/).test(req.url).should.be.true;
                (/userId=abc999/).test(req.url).should.be.true;
            });
        });

        describe('addUsers', function () {
            it('should POST to the world API users end point with the correct params', function () {
                var users = [{ userId: '1', role: 'a' }];

                createWorldAdapter({ filter: 'worldid1' }).addUsers(users);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                (/\/world\/worldid1/).test(req.url).should.be.true;
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
                (/\/world\/gameid1/).test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);
                body.should.be.instanceof(Array);
                body.should.be.length(1);
                body.should.be.eql([user]);

            });

            it('should accept a string with the userId and pass an array to the API call', function () {
                createWorldAdapter({ filter: 'gameid1' }).addUsers('user1');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                (/\/world\/gameid1/).test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);
                body.should.be.instanceof(Array);
                body.should.be.length(1);
                body.should.be.eql([{ userId: 'user1' }]);

            });

            it('should accept an array of string userIds and pass an array of objects to API call', function () {
                createWorldAdapter({ filter: 'gameid1' }).addUsers(['user1', 'user2']);

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                (/\/world\/gameid1/).test(req.url).should.be.true;
                var body = JSON.parse(req.requestBody);
                body.should.be.instanceof(Array);
                body.should.be.length(2);
                body.should.be.eql([{ userId: 'user1' }, { userId: 'user2' }]);

            });

            it('should take the worldId as the second parameter if its a string', function () {
                createWorldAdapter().addUsers([{ userId: '1', role: '1' }], 'gameid1');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/world\/gameid1\/users/);

            });

            it('should take the worldid from the service options or the override options', function () {
                createWorldAdapter().addUsers([{ userId: '1', role: '1' }], { filter: 'worldid1' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/\/world\/worldid1\/users/);
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

        describe('updateUser', function () {
            it('should patch the correct user for the correct world', function () {
                createWorldAdapter({ filter: 'gameid1' }).updateUser({ userId: '123', role: 'abc' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
                req.url.should.match(/\/world\/gameid1\/users\/123/);
            });

            it('should patch the correct role', function () {
                createWorldAdapter({ filter: 'gameid1' }).updateUser({ userId: '123', role: 'abc' });

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                body.should.eql({ role: 'abc' });
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

        describe('deleteRun', function () {
            it('should call DELETE on game/run', function () {
                createWorldAdapter().deleteRun('gameid1');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/world\/gameid1\/run/);
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

            it('should take the current filter if no worldId is passed in', function () {
                createWorldAdapter({ filter: 'gameid1' }).deleteRun();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                req.url.should.match(/\/world\/gameid1\/run/);
            });
        });

        describe('autoAssign', function () {
            it('should POST to the assign API', function () {
                createWorldAdapter().autoAssign();

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                req.url.should.match(/multiplayer\/assign/);
            });

            it('should pass the account, project and group in body', function () {
                createWorldAdapter({ group: 'group-name' }).autoAssign();

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                expect(body.account).to.be.equal('forio');
                expect(body.project).to.be.equal('js-libs');
                expect(body.group).to.be.equal('group-name');
            });

            it('should pass the maxUsers if specificed in options', function () {
                createWorldAdapter({ group: 'group-name' }).autoAssign({ maxUsers: 5 });

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                expect(body.maxUsers).to.be.equal(5);
            });

            it('should pass the userIds if specificed in options', function () {
                createWorldAdapter({ group: 'group-name' }).autoAssign({ userIds: ['a', 'b', 'c', 'd', 'e'] });

                var req = server.requests.pop();
                var body = JSON.parse(req.requestBody);
                expect(body.userIds).to.eql(['a', 'b', 'c', 'd', 'e']);
            });

            describe('getProjectSettings', function () {
                it('should GET to multiplayer/project API with correct settings', function () {
                    createWorldAdapter().getProjectSettings();

                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('GET');
                    req.url.should.match(/\/project\/forio\/js-libs/);
                });
            });

        });

    });

}());
