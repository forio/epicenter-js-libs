'use strict';
(function () {

    var FileService = F.service.File;
    var account = 'forio';
    var project = 'js-libs';
    var projectUpload = 'upload';

    var baseURL = (new F.service.URL({ accountPath: account, projectPath: project })).getAPIPath('file');
    var uploadBase = (new F.service.URL({ accountPath: account, projectPath: projectUpload })).getAPIPath('file');


    describe('File API Adapter', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/file\/forio\/js-libs\/(model|static)\/file/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondWith(/(.*)\/file\/forio\/upload\/static/, function (xhr, id) {
                if (xhr.requestBody && xhr.requestBody.indexOf) {
                    if (xhr.requestBody.indexOf('existing.html') > -1 && xhr.method === 'POST') {
                        return xhr.respond(409, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
                    } else if (xhr.requestBody.indexOf('new.html') > -1 && xhr.method === 'PUT') {
                        return xhr.respond(404, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
                    } else if (xhr.requestBody.indexOf('serverError.html') > -1) {
                        return xhr.respond(500, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
                    }
                }
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        it('should pass through string tokens', function () {
            var fs = new FileService({ token: 'xyz' });
            fs.getContents('file', 'model');

            var req = server.requests.pop();
            req.requestHeaders.Authorization.should.equal('Bearer xyz');
        });

        it('should pass in transport options to the underlying ajax handler', function () {
            var callback = sinon.spy();
            var fs = new FileService({ account: account, project: project, transport: { beforeSend: callback } });
            fs.getContents('file', 'model');

            server.respond();
            callback.should.have.been.called;
        });

        describe('#getContents', function () {
            it('Should do a GET', function () {
                var fs = new FileService({ account: account, project: project });
                fs.getContents('file', 'model');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });

            it('should hit the right url for static files', function () {
                var fs = new FileService({ account: account, project: project, folderType: 'static' });
                fs.getContents('file', 'static');

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'static/file');
            });

            it('should hit the right url for model files', function () {
                var fs = new FileService({ account: account, project: project, folderType: 'model' });
                fs.getContents('file', 'model');

                var req = server.requests.pop();
                req.url.should.equal(baseURL + 'model/file');
            });
        });

        describe('#replaceFile', function () {
            var fs;
            beforeEach(function () {
                fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
            });
            it('Should do a PUT', function () {
                return fs.replace('test.html', '<html></html>').then(function () {
                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('PUT');
                });
            });
            it('Should use the right url', function () {
                return fs.replace('test.html', '<html></html>').then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(uploadBase + 'static/');
                });
            });
            it('Should set the right content', function () {
                var content = '<html></html>';
                return fs.replace('test.html', content).then(function () {
                    var req = server.requests.pop();
                    req.requestBody.should.include(content);
                    req.requestBody.should.include('test.html');
                });
            });
            it('should accept formdata', function () {
                var content = '<html></html>';
                var formData = new FormData();
                formData.append('file', content, 'file.html');
                return fs.replace('test.html', formData).then(function () {
                    var req = server.requests.pop();
                    expect(req.requestBody).to.be.instanceof(FormData);
                });
            });
        });

        describe('#create', function () {
            it('Should do a POST', function () {
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.create('test.html', '<html></html>');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });
            it('Should use the right url', function () {
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.create('test.html', '<html></html>');

                var req = server.requests.pop();
                req.url.should.equal(uploadBase + 'static/');
            });
            it('Should set the right content', function () {
                var content = '<html></html>';
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.create('test.html', content);
                server.requests.should.have.lengthOf(2);

                var req = server.requests.pop();
                req.requestBody.should.include(content);
                req.requestBody.should.include('test.html');
            });
            it('should overwrite if file is present and `replaceExisting` is set', function (done) {
                server.requests = [];
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.create('existing.html', '<html></html>', true).then(function () {
                    server.requests.should.have.lengthOf(2);
                    var req = server.requests.pop();
                    req.method.toUpperCase().should.equal('PUT');
                    req = server.requests.pop();
                    req.method.toUpperCase().should.equal('POST');
                    done();
                }, function () {
                    done(new Error('Should not fail'));
                });
            });
        });
        describe('#remove', function () {
            it('Should do a DELETE', function () {
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.remove('test.html');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('DELETE');
            });
            it('Should use the right URL', function () {
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.remove('test.html');

                var req = server.requests.pop();
                req.url.should.equal(uploadBase + 'static/test.html');
            });
        });
        describe('#rename', function () {
            it('Should do a PATCH', function () {
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.rename('test.html', 'newName.html');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('PATCH');
            });
            it('Should use the right URL', function () {
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.rename('test.html', 'newName.html');

                var req = server.requests.pop();
                req.url.should.equal(uploadBase + 'static/test.html');
            });
            it('Should build the right body', function () {
                var fs = new FileService({ account: account, project: projectUpload, folderType: 'static' });
                fs.rename('test.html', 'newName.html');

                var req = server.requests.pop();
                JSON.parse(req.requestBody).should.eql({ name: 'newName.html' });
            });
        });
    });
}());
