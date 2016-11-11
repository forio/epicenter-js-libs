(function () {
    'use strict';
    var URLService = F.service.URL;
    var version = F.api.version ? F.api.version + '/' : '';
    describe('URL Service', function () {
        describe('#getAPIPath', function () {
            it('should allow over-riding host & protocol', function () {
                var url = new URLService({ host: 'myapi.forio.com', protocol: 'udp' });
                url.getAPIPath('abc').should.equal('udp://myapi.forio.com/' + version + 'abc/');
            });

            it('should allow setting account and project for file api', function () {
                var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
                url.getAPIPath('file').should.equal('https://api.forio.com/' + version + 'file/forioAccount/forioProj/');
            });
            it('should allow setting account and project for run api', function () {
                var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
                url.getAPIPath('run').should.equal('https://api.forio.com/' + version + 'run/forioAccount/forioProj/');
            });
            it('should allow setting account and project for data api', function () {
                var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj' });
                url.getAPIPath('data').should.equal('https://api.forio.com/' + version + 'data/forioAccount/forioProj/');
            });

            it('should allow over-riding the version', function () {
                var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj', versionPath: '' });
                url.getAPIPath('data').should.equal('https://api.forio.com/data/forioAccount/forioProj/');
            });

            it('should allow over-riding host and protocol globally', function () {
                URLService.defaults = { protocol: 'htttps', host: 'funky.forio.com' };
                var url = new URLService({ accountPath: 'forioAccount', projectPath: 'forioProj', versionPath: '' });
                url.getAPIPath('data').should.equal('htttps://funky.forio.com/data/forioAccount/forioProj/');

                // Delete global settings to avoid affecting other tests
                delete F.service.URL.defaults;
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
}());
