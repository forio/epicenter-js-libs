(function () {
    'use strict';

    var RunService = F.service.Run;

    describe('Run API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/run\/(.*)\/(.*)/, function (xhr, id){
                console.log(arguments);
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.autoRespond = true;

        });

        after(function () {
            server.restore();
        });

        describe('#query()', function () {
            it('should convert filters to matrix parameters', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');

                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;saved=true;.price=>1/');

            });
            it('should convert op modifiers to query strings', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({}, {page: 1, limit:2});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');

                //TODO: See what the api does in this case
                req.url.should.equal('https://api.forio.com/run/forio/js-libs/;/?page=1&limit=2');
            });
        });

        describe('#load()', function () {
            it('should take in a run id and queries the server', function () {
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.load('myfancyrunid', {include: 'score'});

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');

                req.url.should.equal('https://api.forio.com/run/forio/js-libs/myfancyrunid/?include=score');
            });
        });
    });
})();
