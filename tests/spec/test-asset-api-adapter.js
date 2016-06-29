(function () {
    'use strict';

    var AssetService = F.service.Asset;
    var baseURL = (new F.service.URL()).getAPIPath('asset');

    describe('Asset API Adapter', function () {
        var server;
        var defaults = {
            account: 'forio',
            project: 'js-libs',
            group: 'asset-group',
            userId: 'myUserId'
        };

        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('PUT',  /(.*)\/asset\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(204);
            });
            server.respondWith('GET',  /(.*)\/asset\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' },
                    JSON.stringify(['file.txt', 'file2.txt']));
            });
            server.respondWith('POST',  /(.*)\/asset\/(.*)\/(.*)/,  function (xhr, id) {
                xhr.respond(204);
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        it('should pass through string tokens', function () {
            var as = new AssetService(_.extend({}, defaults, { token: 'abc' }));
            as.create('file.txt');

            var req = server.requests.pop();
            req.requestHeaders.Authorization.should.equal('Bearer abc');
        });

        it('should allow to set the scope on service level', function () {
            var as = new AssetService(_.extend({}, defaults, { scope: 'user' }));
            as.list();

            var req = server.requests.pop();
            req.url.should.equal(baseURL + 'user/forio/js-libs/asset-group/myUserId');

            as = new AssetService(_.extend({}, defaults, { scope: 'group' }));
            as.list();
            req = server.requests.pop();
            req.url.should.equal(baseURL + 'group/forio/js-libs/asset-group');

            as = new AssetService(_.extend({}, defaults, { scope: 'project' }));
            as.list();
            req = server.requests.pop();
            req.url.should.equal(baseURL + 'project/forio/js-libs');
        });

        it('should allow to override scope on each function', function () {
            var as = new AssetService(defaults);
            server.requests = [];
            as.create('file.txt', {}, { scope: 'project' });
            as.get('file.txt', { scope: 'project' });
            as.list({ scope: 'project' });
            as.replace('file.txt', {}, { scope: 'project' });
            as.delete('file.txt', { scope: 'project' });
            var urls = $.map(server.requests, function (req) {
                return req.url;
            });
            console.log(urls);
            urls.should.eql([
                baseURL + 'project/forio/js-libs/file.txt', //create
                baseURL + 'project/forio/js-libs/file.txt', // get
                baseURL + 'project/forio/js-libs', // list
                baseURL + 'project/forio/js-libs/file.txt', // replace
                baseURL + 'project/forio/js-libs/file.txt' //delete
            ]);
            server.requests = [];
        });

        it('should validate the filename is not empty', function () {
            var as = new AssetService(defaults);
            var create = function () { as.create('', {}); };
            create.should.throw(Error);
        });

        it('should validate the account, project, group and userId are not empty', function () {
            var cookieDummy = {
                get: function () {
                    return '';
                },
                set: function (newCookie) {}
            };
            var as = new AssetService({ store: { cookie: cookieDummy } });
            var noAccount = function () { as.create('file.txt', {}); };
            var noProject = function () { as.create('file.txt', {}, { account: 'forio' }); };
            var noGroup = function () { as.create('file.txt', {}, { account: 'forio', project: 'js-libs' }); };
            var noUserId = function () { as.create('file.txt', {}, { account: 'forio', project: 'js-libs', group: 'asset-group' }); };
            var allRequired = function () { as.create('file.txt', {}, defaults); };
            noAccount.should.throw(Error);
            noProject.should.throw(Error);
            noGroup.should.throw(Error);
            noUserId.should.throw(Error);
            allRequired.should.not.throw(Error);

            as = new AssetService({ scope: 'group', store: { cookie: cookieDummy } });
            noAccount.should.throw(Error);
            noProject.should.throw(Error);
            noGroup.should.throw(Error);
            noUserId.should.not.throw(Error);
            allRequired.should.not.throw(Error);

            as = new AssetService({ scope: 'project', store: { cookie: cookieDummy } });
            noAccount.should.throw(Error);
            noProject.should.throw(Error);
            noGroup.should.not.throw(Error);
            noUserId.should.not.throw(Error);
            allRequired.should.not.throw(Error);
        });

        describe('#create()', function () {
            it('should post a base64 encoded file', function () {
                var aa = new F.service.Asset(defaults);
                aa.create('file.txt', { encoding: 'BASE_64', data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=' }, { scope: 'user' });

                var req = server.requests.pop();
                var data = JSON.parse(req.requestBody);
                data.encoding.should.equal('BASE_64');
                data.data.should.equal('VGhpcyBpcyBhIHRlc3QgZmlsZS4=');
                req.requestHeaders['Content-Type'].should.contain('application/json');
                req.method.should.equal('POST');
            });

            it('should pass a FormData object', function () {
                var aa = new F.service.Asset(defaults);
                var formData = new FormData();
                formData.append('file', 'This is a test file.', 'file.txt');
                aa.create('ignored.txt', formData, { scope: 'user' });

                var req = server.requests.pop();
                req.method.should.equal('POST');
                req.requestBody.should.be.instanceof(FormData);
            });
        });

        describe('#get()', function () {
            it('should get the user asset from the API', function () {
                var aa = new F.service.Asset(defaults);
                aa.get('file.txt', { scope: 'user' });

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'user/forio/js-libs/asset-group/myUserId/file.txt');
                req.method.should.equal('GET');
            });

            it('should get the group asset from the API', function () {
                var aa = new F.service.Asset(defaults);
                aa.get('file.txt', { scope: 'group' });

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'group/forio/js-libs/asset-group/file.txt');
                req.method.should.equal('GET');
            });

            it('should get the project asset from the API', function () {
                var aa = new F.service.Asset(defaults);
                aa.get('file.txt', { scope: 'project' });

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'project/forio/js-libs/file.txt');
                req.method.should.equal('GET');
            });
        });

        describe('#list()', function () {
            it('should get the list of the assets for the user', function () {
                var callback = sinon.spy();
                var aa = new F.service.Asset(defaults);
                aa.list({ scope: 'user', fullUrl: false }).done(callback);

                server.respond();
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'user/forio/js-libs/asset-group/myUserId');
                req.method.should.equal('GET');
                callback.should.have.been.called;
                callback.should.have.been.calledWith(['file.txt', 'file2.txt']);
            });

            it('should get the list of the assets for the user with the full URL', function () {
                var callback = sinon.spy();
                var aa = new F.service.Asset(defaults);
                aa.list({ scope: 'user' }).done(callback);

                server.respond();
                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'user/forio/js-libs/asset-group/myUserId');
                req.method.should.equal('GET');
                callback.should.have.been.called;
                callback.should.have.been.calledWith([
                    baseURL + 'user/forio/js-libs/asset-group/myUserId/file.txt',
                    baseURL + 'user/forio/js-libs/asset-group/myUserId/file2.txt']);
            });
        });

        describe('#replace()', function () {
            it('should put a base64 encoded file', function () {
                var aa = new F.service.Asset(defaults);
                aa.replace('file.txt', { encoding: 'BASE_64', data: 'VGhpcyBpcyBhIHRlc3QgZmlsZS4=' }, { scope: 'user' });

                var req = server.requests.pop();
                var data = JSON.parse(req.requestBody);
                data.encoding.should.equal('BASE_64');
                data.data.should.equal('VGhpcyBpcyBhIHRlc3QgZmlsZS4=');
                req.requestHeaders['Content-Type'].should.contain('application/json');
                req.method.should.equal('PUT');
            });

            it('should pass a FormData object', function () {
                var aa = new F.service.Asset(defaults);
                var formData = new FormData();
                formData.append('file', 'This is a test file.', 'file.txt');
                aa.replace('ignored.txt', formData, { scope: 'user' });

                var req = server.requests.pop();
                req.method.should.equal('PUT');
                req.requestBody.should.be.instanceof(FormData);
            });
        });

        describe('#delete()', function () {
            it('should delete a user asset', function () {
                var aa = new F.service.Asset(defaults);
                aa.delete('file.txt', { scope: 'user' });

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'user/forio/js-libs/asset-group/myUserId/file.txt');
                req.method.should.equal('DELETE');
            });

            it('should delete a group asset', function () {
                var aa = new F.service.Asset(defaults);
                aa.delete('file.txt', { scope: 'group' });

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'group/forio/js-libs/asset-group/file.txt');
                req.method.should.equal('DELETE');
            });

            it('should delete a project asset', function () {
                var aa = new F.service.Asset(defaults);
                aa.delete('file.txt', { scope: 'project' });

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'project/forio/js-libs/file.txt');
                req.method.should.equal('DELETE');
            });
        });

        describe('#assetUrl()', function () {
            it('should build URL for the user scope', function () {
                var aa = new F.service.Asset(defaults);
                var url = aa.assetUrl('file.txt', { scope: 'user' });

                url.should.equal(baseURL + 'user/forio/js-libs/asset-group/myUserId/file.txt');
            });

            it('should build URL for the group scope', function () {
                var aa = new F.service.Asset(defaults);
                var url = aa.assetUrl('file.txt', { scope: 'group' });

                url.should.equal(baseURL + 'group/forio/js-libs/asset-group/file.txt');
            });

            it('should build URL for the project scope', function () {
                var aa = new F.service.Asset(defaults);
                var url = aa.assetUrl('file.txt', { scope: 'project' });

                url.should.equal(baseURL + 'project/forio/js-libs/file.txt');
            });
        });
    });
})();
