import URLService from '../index';
import apiversion from '../../../api-version.json';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

describe('URL Service', function () {
    function getHost() {
        return window.location.host || ''; //for phantomjs
    }

    var version = apiversion.version ? apiversion.version + '/' : '';
    const oldDefaults = Object.assign({}, URLService.defaults);

    afterEach(()=> {
        URLService.defaults = Object.assign({}, oldDefaults);
    });

    describe('#isLocalhost', function () {
        it('should be overridable with literal value', function () {
            var url = new URLService({ isLocalhost: false });
            url.isLocalhost().should.equal(false);

            var url2 = new URLService({ isLocalhost: true });
            url2.isLocalhost().should.equal(true);
        });
        it('should be overridable with a function', function () {
            var url = new URLService({ isLocalhost: function () { return false; } });
            url.isLocalhost().should.equal(false);

            var url2 = new URLService({ isLocalhost: function () { return true; } });
            url2.isLocalhost().should.equal(true);
        });
    });
    describe('#baseURL', ()=> {
        it('should allow overriding as a string', ()=> {
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
            url.baseURL = 'proxy/';
            url.getAPIPath('run').should.equal('proxy/run/forioAccount/forioProj/');
        });
        it('should allow overriding as a function', ()=> {
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
            url.baseURL = ()=> 'proxy/';
            url.getAPIPath('run').should.equal('proxy/run/forioAccount/forioProj/');
        });
        it('should allow over-riding from the defaults', function () {
            URLService.defaults.baseURL = 'proxy/';
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj', versionPath: '' });
            url.getAPIPath('run').should.equal('proxy/run/forioAccount/forioProj/');
        });
    });

    describe('#url', function () {
        it('should default to current hostname if not localhost', function () {
            var url = new URLService({ isLocalhost: false });
            url.host.should.equal(getHost());
        });
        it('should default to api.forio.com if localhost', function () {
            var url = new URLService({ isLocalhost: true });
            url.host.should.equal('api.forio.com');
        });
        it('should allow over-riding host even if localhost', function () {
            var url = new URLService({ isLocalhost: true, host: 'some.of.my.servers' });
            url.host.should.equal('some.of.my.servers');
        });
    });
    describe('#getAPIPath', function () {
        it('should allow over-riding host & protocol', function () {
            var url = new URLService({ host: 'myapi.forio.com', protocol: 'udp' });
            url.getAPIPath('abc').should.equal('udp://myapi.forio.com/' + version + 'abc/');
        });

        it('should allow setting account and project for file api', function () {
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
            url.getAPIPath('file').should.equal('https://' + url.host + '/' + version + 'file/forioAccount/forioProj/');
        });
        it('should allow setting account and project for run api', function () {
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
            url.getAPIPath('run').should.equal('https://' + url.host + '/' + version + 'run/forioAccount/forioProj/');
        });
        it('should allow setting account and project for data api', function () {
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
            url.getAPIPath('data').should.equal('https://' + url.host + '/' + version + 'data/forioAccount/forioProj/');
        });

        it('should allow over-riding the version', function () {
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj', versionPath: '' });
            url.getAPIPath('data').should.equal('https://' + url.host + '/data/forioAccount/forioProj/');
        });

        it('should allow over-riding host and protocol globally', function () {
            var oldDefaults = $.extend({}, URLService.defaults);

            URLService.defaults = { protocol: 'htttps', host: 'funky.forio.com' };
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj', versionPath: '' });
            url.getAPIPath('data').should.equal('htttps://funky.forio.com/data/forioAccount/forioProj/');

            URLService.defaults = oldDefaults;
        });
        it('should allow overloading with a function', ()=> {
            var oldDefaults = $.extend({}, URLService.defaults);

            URLService.defaults = { getAPIPath: sinon.spy((api)=> `foobar/${api}/`) };
            var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj', versionPath: '' });
            url.getAPIPath('data').should.equal('foobar/data/');

            URLService.defaults = oldDefaults;
        });

        it('should return true on local environments', function () {
            var url = new URLService({ pathname: '/index.html', host: 'local.forio.com:8080' });
            url.isLocalhost().should.be.true;
        });

        it('should return false on production environments', function () {
            var url = new URLService({ pathname: '/app/acme/hello_world', host: 'forio.com' });
            url.isLocalhost().should.be.false;
        });
        it('should return false on custom domain environments', function () {
            var url = new URLService({ pathname: 'oranges', host: 'apples.com' });
            url.isLocalhost().should.be.false;
        });

    });
});
