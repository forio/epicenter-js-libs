import TimeService from '../index';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

var baseURL = (new URLService()).getAPIPath('time');

describe('Timer API Service', function () {
    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith(/(.*)\/time/, function (xhr, id) {
            var date = (new Date(Date.now())).toISOString();
            xhr.respond(200, { 'Content-Type': 'text/plain' }, date);
        });
        server.respondImmediately = true;
    });

    afterEach(function () {
        server.requests = [];
    });
    after(function () {
        server.restore();
    });

    it('should do a GET', function () {
        var ts = new TimeService();
        return ts.getTime().then(function () {
            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
        });
    });
    it('should hit the right url', function () {
        var ts = new TimeService();
        return ts.getTime().then(function () {
            var req = server.requests.pop();
            req.url.should.equal(baseURL);
        });
    });
    it('should respect server config', function () {
        var ts = new TimeService({
            server: {
                protocol: 'https',
                host: 'foobar.com'
            }
        });
        return ts.getTime().then(function () {
            var req = server.requests.pop();
            req.url.should.equal('https://foobar.com/v2/time/');
        });
    });
    it('should return a date object', function () {
        var ts = new TimeService();
        return ts.getTime().then(function (t) {
            t.should.be.instanceof(Date);
        });
    });
});
