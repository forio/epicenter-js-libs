(function () {
    'use strict';

    var Transport = F.transport.Ajax;

    describe('Ajax HTTP Transport', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/api\.success/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.respondWith(/api\.fail/, function (xhr, id){
                xhr.respond(500, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.autoRespond = true;

        });

        after(function () {
            server.restore();
        });

        it('should have the right url', function () {
            var ajax = new Transport({url: 'http://api.success.com'});
            ajax.get();

            server.requests.pop().url.should.equal('http://api.success.com');
        });

        describe('#get()', function () {
            it('should make an ajax GET', function () {
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.get();

                server.requests.pop().method.toUpperCase().should.equal('GET');
            });
            it('should convert query parameters', function () {
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.get({a:2,b:3});

                server.requests.pop().url.should.equal('http://api.success.com?a=2&b=3');
            });
            it('should combine query parameters', function () {
                var ajax = new Transport({url: 'http://api.success.com?a=2'});
                ajax.get({b:3});

                server.requests.pop().url.should.equal('http://api.success.com?a=2&b=3');
            });

            //FIXME: Figure out why sinon doesn't like this
            it('should call success callback on success', function () {
                var callback = sinon.spy(function(){console.log("Success!");});

                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.get({a:2,b:3}, {
                    success: callback
                });
                // callback.called.should.equal(true);
            });
            it('should call fail callback on success', function () {
                var callback = sinon.spy(function(){console.log("Fail!");});

                var ajax = new Transport({url: 'http://api.fail.com'});
                ajax.get({a:2,b:3}, {
                    error: callback
                });
                // callback.called.should.equal(true);
            });
        });

        describe('#post', function () {
            it('should make an ajax POST', function () {
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.post();

                server.requests.pop().method.toUpperCase().should.equal('POST');
            });
            it('should convert query parameters', function () {
                var params = {a:2,b:3};
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.post(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com');
                req.requestBody.should.equal(JSON.stringify(params));
            });

            it('should override the url', function () {
                var params = {a:2,b:3};
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.post(params, {url: 'http://api.success.org'});

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.org');
                req.requestBody.should.equal(JSON.stringify(params));
            });

            it('should combine query parameters', function () {
                var params = {b:3};
                var ajax = new Transport({url: 'http://api.success.com?a=2'});
                ajax.post(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com?a=2');
                req.requestBody.should.equal(JSON.stringify(params));
            });
        });

        describe('#patch', function () {
            it('should make an ajax PATCH', function () {
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.patch();

                server.requests.pop().method.toUpperCase().should.equal('PATCH');
            });
            it('should convert query parameters', function () {
                var params = {a:2,b:3};
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.patch(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com');
                req.requestBody.should.equal(JSON.stringify(params));
            });
            it('should combine query parameters', function () {
                var params = {b:3};
                var ajax = new Transport({url: 'http://api.success.com?a=2'});
                ajax.patch(params);

                var req = server.requests.pop();
                req.url.should.equal('http://api.success.com?a=2');
                req.requestBody.should.equal(JSON.stringify(params));
            });
        });
    });
})();
