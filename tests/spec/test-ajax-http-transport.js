(function () {
    'use strict';

    var Transport = F.transport.Ajax;

    describe('Ajax HTTP Transport', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('GET', /api\.success/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondWith('GET', /api\.fail/, function (xhr, id) {
                xhr.respond(500, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondImmediately = true;

        });

        after(function () {
            server.restore();
        });

        it('should have the right url', function () {
            var ajax = new Transport({ url: 'http://api.success.com' });
            ajax.get();

            server.requests.pop().url.should.equal('http://api.success.com');
        });

        it('should allow urls to be functions', function () {
            var urlResolver = sinon.stub();
            urlResolver.onFirstCall().returns('http://api.success0.com');
            urlResolver.onSecondCall().returns('http://api.success1.com');

            var ajax = new Transport({ url: urlResolver });
            ajax.get();

            urlResolver.calledOnce.should.equal(true);
            server.requests.pop().url.should.equal('http://api.success0.com');

            ajax.get();
            urlResolver.calledTwice.should.equal(true);
            server.requests.pop().url.should.equal('http://api.success1.com');
        });

        it('should allow data to be functions', function () {
            var dataSource = sinon.stub();
            dataSource.onFirstCall().returns({ value: 1 });
            dataSource.onSecondCall().returns({ value: 2 });

            var ajax = new Transport({ url: 'http://api.success.com' });
            ajax.post(dataSource);

            dataSource.calledOnce.should.equal(true);
            server.requests.pop().requestBody.should.equal(JSON.stringify({ value: 1 }));

            ajax.post(dataSource);
            dataSource.calledTwice.should.equal(true);
            server.requests.pop().requestBody.should.equal(JSON.stringify({ value: 2 }));
        });


        // TODO: Determine if this is really useful
        // it('should pass in default parameters in every call', function () {
        //     var ajax = new Transport({ url: 'http://api.success.com', data: { a: '1' } });
        //     ajax.get({ b:2 });

        //     server.requests.pop().url.should.equal('http://api.success.com?a=1&b=2');
        // });

        describe('#get()', function () {
            it('should make an ajax GET', function () {
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.get();

                server.requests.pop().method.toUpperCase().should.equal('GET');
            });
            it('should convert query parameters', function () {
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.get({ a: 2, b: 3 });

                server.requests.pop().url.should.equal('http://api.success.com?a=2&b=3');
            });
            it('should combine query parameters', function () {
                var ajax = new Transport({ url: 'http://api.success.com?a=2' });
                ajax.get({ b: 3 });

                server.requests.pop().url.should.equal('http://api.success.com?a=2&b=3');
            });

            it('should call success callback on success', function () {
                var callback = sinon.spy();

                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.get({ a: 2, b: 3 }, {
                    success: callback
                });
                callback.called.should.equal(true);
            });
            it('should call fail callback on success', function () {
                var callback = sinon.spy();

                var ajax = new Transport({ url: 'http://api.fail.com' });
                ajax.get({ a: 2, b: 3 }, {
                    error: callback
                });

                callback.called.should.equal(true);
            });

            it('should allow over-riding the parameter parese', function () {
                var params = { a: 2, b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.get(params, {
                    parameterParser: JSON.stringify
                });

                server.requests.pop().url.should.equal('http://api.success.com?' + JSON.stringify(params));
            });
        });

        describe('#post', function () {
            it('should make an ajax POST', function () {
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.post();

                server.requests.pop().method.toUpperCase().should.equal('POST');
            });
            it('should convert query parameters', function () {
                var params = { a: 2, b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.post(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com');
                req.requestBody.should.equal(JSON.stringify(params));
            });

            it('should override the url', function () {
                var params = { a: 2, b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.post(params, { url: 'http://api.success.org' });

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.org');
                req.requestBody.should.equal(JSON.stringify(params));
            });

            it('should combine query parameters', function () {
                var params = { b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com?a=2' });
                ajax.post(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com?a=2');
                req.requestBody.should.equal(JSON.stringify(params));
            });

            it('should allow posting arrays', function () {
                var params = [1, 2];
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.post(params);

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify(params));
            });
            it('should allow posting strings', function () {
                var params = 'hello';
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.post(params);

                var req = server.requests.pop();
                req.requestBody.should.equal('hello');
            });
        });

        describe('#put', function () {
            it('should make an ajax PUT', function () {
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.put();

                server.requests.pop().method.toUpperCase().should.equal('PUT');
            });
            it('should convert query parameters', function () {
                var params = { a: 2, b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.put(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com');
                req.requestBody.should.equal(JSON.stringify(params));
            });
            it('should combine query parameters', function () {
                var params = { b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com?a=2' });
                ajax.put(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com?a=2');
                req.requestBody.should.equal(JSON.stringify(params));
            });
        });

        describe('#patch', function () {
            it('should make an ajax PATCH', function () {
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.patch();

                server.requests.pop().method.toUpperCase().should.equal('PATCH');
            });
            it('should convert query parameters', function () {
                var params = { a: 2, b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.patch(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com');
                req.requestBody.should.equal(JSON.stringify(params));
            });
            it('should combine query parameters', function () {
                var params = { b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com?a=2' });
                ajax.patch(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com?a=2');
                req.requestBody.should.equal(JSON.stringify(params));
            });
        });

        describe('#delete', function () {
            it('should make an ajax DELETE', function () {
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.delete();

                server.requests.pop().method.toUpperCase().should.equal('DELETE');
            });
            it('should convert query parameters', function () {
                var params = { a: 1, b: 2 };
                var ajax = new Transport({ url: 'http://api.success.com' });
                ajax.delete(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com?a=1&b=2');
            });
            it('should combine query parameters', function () {
                var params = { b: 3 };
                var ajax = new Transport({ url: 'http://api.success.com?a=2' });
                ajax.delete(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com?a=2&b=3');
            });
        });
    });
}());
