(function () {
    'use strict';

    var Transport = F.transport.Ajax;

    describe('Ajax HTTP Transport', function () {
        describe('#get()', function () {
            var xhr, requests;
            before(function () {
                xhr = sinon.useFakeXMLHttpRequest();
                requests = [];
                xhr.onCreate = function (req) { requests.push(req); };
            });

            after(function () {
                xhr.restore();
            });

            it('should make an ajax GET', function () {
                var ajax = new Transport({url: 'http://google.com'});
                ajax.get();

                requests.length.should.equal(1);
                requests[0].method.toUpperCase().should.equal('GET');
            });
            it('should have the right url', function () {
                var ajax = new Transport({url: 'http://google.com'});
                ajax.get();

                requests[0].url.should.equal('http://google.com');
            });
            it('should convert query parameters', function () {
                var ajax = new Transport({url: 'http://google.com?a=2&b=3'});
                ajax.get({a:2,b:3});

                // requests[0].url.should.equal('http://google.com?a=2&b=3');
            });

            it('should call success callback on success', function () {
            });
            it('should call fail callback on success', function () {
            });
            it('should call progress callback on success', function () {
            });
        });

        describe('#post', function () {

        });
    });
})();
