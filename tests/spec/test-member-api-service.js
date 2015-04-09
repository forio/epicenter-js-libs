(function () {
    'use strict';

    describe('Member API Service', function () {
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

        function createMemberAdapter(options) {
            return new F.service.Member(_.extend({
                account: 'forio',
                project: 'js-libs'
            }, options));
        }

        describe('getGroupsByUser', function () {
            it('should call GET on the Member API with the userId parameter and the token', function () {
                createMemberAdapter({ token: '123' })
                    .getGroupsByUser('abc999');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/member\//.test(req.url).should.be.true;
                /userId=abc999/.test(req.url).should.be.true;
                /Bearer 123/.test(req.requestHeaders.Authorization).should.be.true;
            });

            it('should call GET on the Member API with the userId parameter, as an object, and the token', function () {
                createMemberAdapter({ token: '123' })
                    .getGroupsByUser({ userId: 'abc999' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/member\//.test(req.url).should.be.true;
                /userId=abc999/.test(req.url).should.be.true;
                /Bearer 123/.test(req.requestHeaders.Authorization).should.be.true;
            });

            it('should throw error when no userId is specified', function () {
                var getGroupsByUser = function () {
                    createMemberAdapter({ token: '123' }).getGroupsByUser();
                };
                expect(getGroupsByUser).to.throw(Error);
            });
        });

        describe('getGroupDetails', function () {
            it('should call GET on the Member API with the group parameter in the URL and the token', function () {
                createMemberAdapter({ token: '123' })
                    .getGroupDetails('abc999');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/member\/local\/abc999/.test(req.url).should.be.true;
                /Bearer 123/.test(req.requestHeaders.Authorization).should.be.true;
            });

            it('should call GET on the Member API with the group parameter, as an object, in the URL and the token', function () {
                createMemberAdapter({ token: '123' })
                    .getGroupDetails({ groupId: 'abc999' });

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                /\/member\/local\/abc999/.test(req.url).should.be.true;
                /Bearer 123/.test(req.requestHeaders.Authorization).should.be.true;
            });

            it('should throw error when no groupId is specified', function () {
                var getGroupDetails = function () {
                    createMemberAdapter({ token: '123' }).getGroupDetails();
                };
                expect(getGroupDetails).to.throw(Error);
            });
        });
    });

})();