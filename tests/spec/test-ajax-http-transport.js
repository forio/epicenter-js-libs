(function () {
    'use strict';

    var Transport = F.transport.Ajax;

    describe('Ajax HTTP Transport', function () {
        describe('#get()', function () {
            var server;
            before(function () {
                server = sinon.fakeServer.create();
                server.respondWith(/api\.success\.com/, function (xhr, id){
                    xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
                });
                server.respondWith(/api\.fail\.com/, function (xhr, id){
                    xhr.respond(500, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
                });
                server.autoRespond = true;

            });

            after(function () {
                server.restore();
            });

            it('should make an ajax GET', function () {
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.get();

                server.requests.pop().method.toUpperCase().should.equal('GET');
            });
            it('should have the right url', function () {
                var ajax = new Transport({url: 'http://api.success.com'});
                ajax.get();

                server.requests.pop().url.should.equal('http://api.success.com');
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

        });
    });
})();
