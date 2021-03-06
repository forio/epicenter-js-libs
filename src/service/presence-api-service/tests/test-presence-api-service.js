import PresenceService from '../index';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

describe('Presence API Service', function () {
    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith('POST', /(.*)\/presence/, function (xhr, id) {
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify({ }));
        });
        server.respondWith('GET', /(.*)\/presence/, function (xhr, id) {
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify([
                { userId: 'a' },
                { userId: 'b' },
            ]));
        });

        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });

    function createPresenceAdapter(options) {
        return new PresenceService(options);
    }

    describe('markOnline', function () {
        it('should call POST on the Presence API with the userId parameter', function () {
            createPresenceAdapter({ token: '123', groupName: 'test-group' })
                .markOnline('abc123');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('POST');
            (/\/presence\//).test(req.url).should.be.true;
            (/abc123/).test(req.url).should.be.true;
            (/Bearer 123/).test(req.requestHeaders.Authorization).should.be.true;
        });

        it('should call POST on the Presence API with the token parameter', function () {
            createPresenceAdapter({ token: '123', groupName: 'test-group' })
                .markOnline('abc123');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('POST');
            (/\/presence\//).test(req.url).should.be.true;
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
        });

        it('should call Delete on the Presence API with the token', function () {
            createPresenceAdapter({ token: '123', groupName: 'test-group' })
                .markOffline('abc123');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('DELETE');
            (/\/presence\//).test(req.url).should.be.true;
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
            var getStatus = function () {
                createPresenceAdapter({ token: '123' }).getStatus();
            };
            expect(getStatus).to.throw(Error);
        });
    });
    describe('getStatusForUsers', function () {
        it('should throw error when no userList is specified', function () {
            var getStatus = function () {
                createPresenceAdapter({ token: '123' }).getStatusForUsers();
            };
            expect(getStatus).to.throw(Error);
        });
        it('should return userlist with online/offline status', ()=> {
            return createPresenceAdapter({ token: '123' }).getStatusForUsers([
                { userId: 'a' },
                { userId: 'b' },
                { userId: 'c' },
            ], 'foobar').then((r)=> {
                expect(r).to.eql([
                    { userId: 'a', isOnline: true },
                    { userId: 'b', isOnline: true },
                    { userId: 'c', isOnline: false },
                ]);
            });
        });
    });
});
