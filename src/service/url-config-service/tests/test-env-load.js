import URLService from '../index';

import chai from 'chai';
import sinon from 'sinon';

import loadEnv from '../env-load';

chai.use(require('sinon-chai'));

var version = (new URLService()).versionPath;

describe('Env Load', function () {
    function getHost() {
        return window.location.host || ''; //for phantomjs
    }
    
    var env = {
        api: {
            host: 'customapi.forio.com',
            protocol: 'https'
        }
    };
    var server;
    beforeEach(function () {
        server = sinon.fakeServer.create();
        server.respondImmediately = true;
    });

    afterEach(function () {
        server.restore();
    });

    describe('load', function () {
        it('should request the server env url', function () {
            var oldDefaults = $.extend({}, URLService.defaults);
            URLService.defaults.isLocalhost = function () { return false; };
            loadEnv();

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            req.url.should.equal(window.location.protocol + '//' + getHost() + '/epicenter/' + version + 'config');

            URLService.defaults = oldDefaults;
        });
        it('should default to forio.com for localhost', function () {
            var oldDefaults = $.extend({}, URLService.defaults);
            URLService.defaults.isLocalhost = function () { return true; };
            loadEnv();

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('GET');
            req.url.should.equal('https://forio.com/epicenter/' + version + 'config');

            URLService.defaults = oldDefaults;
        });

        it('should set protocol and host to the UrlConfingService', function (done) {
            server.respondWith('GET', /(.*)\/epicenter\/(.*)\/config/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify(env));
            });
            var oldDefaults = $.extend({}, URLService.defaults);
            URLService.defaults = {};
            loadEnv(function () {
                URLService.defaults.protocol.should.equal('https');
                URLService.defaults.host.should.equal('customapi.forio.com');
                URLService.defaults = oldDefaults;
                done();
            });
        });
    });
});
