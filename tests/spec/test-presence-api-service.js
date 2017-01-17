(function () {
    'use strict';

    describe('Presence API Service', function () {
        var server;
        var cookieDummy = {
            get: function () {
                return '';
            },
            set: function (newCookie) {}
        };
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('POST', /(.*)\/game/, function (xhr, id) {
                xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({ }));
            });

            server.respondImmediately = true;
        });

        after(function () {
            server.restore();
        });

        function createPresenceAdapter(options) {
            return new F.service.Presence(options);
        }

        describe('markOnline', function () {
            it('should call POST on the Presence API with the userId parameter and the token', function () {
                createPresenceAdapter({ token: '123', groupName: 'test-group' })
                    .markOnline('abc123');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
                (/\/presence\//).test(req.url).should.be.true;
                (/abc123/).test(req.url).should.be.true;
                (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
            });

            it('should throw error when no userId is specified', function () {
                var markOnline = function () {
                    createPresenceAdapter({ token: '123' }).markOnline();
                };
                expect(markOnline).to.throw(Error);
            });
        });

        describe('markOffline', function () {
            it('should call Delete on the Presence API with the userId parameter and the token', function () {
                createPresenceAdapter({ token: '123', groupName: 'test-group' })
                    .markOffline('abc123');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
                (/\/presence\//).test(req.url).should.be.true;
                (/abc123/).test(req.url).should.be.true;
                (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
            });

            it('should throw error when no userId is specified', function () {
                var markOnline = function () {
                    createPresenceAdapter({ token: '123' }).markOffline();
                };
                expect(markOnline).to.throw(Error);
            });
        });


        describe('getStatus', function () {
            it('should call GET on the Presence API with the groupName parameter and the token', function () {
                createPresenceAdapter({ token: '123' })
                    .getStatus('groupName');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
                (/\/presence\//).test(req.url).should.be.true;
                (/groupName/).test(req.url).should.be.true;
                (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
            });

            it('should throw error when no groupName is specified', function () {
                var markOnline = function () {
                    createPresenceAdapter({ token: '123' }).getStatus();
                };
                expect(markOnline).to.throw(Error);
            });
        });
    });
}());
