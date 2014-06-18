(function() {

    var DataService = F.service.Data;

    describe('Data API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith(/(.*)\/run\/(.*)\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
        });

        after(function () {
            server.restore();
        });

        describe('#load', function () {
            it('Should do a GET', function () {
                var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
                ds.load('name');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('GET');
            });

            it('should hit the right url', function () {
                var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
                ds.load('name');

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/data/forio/js-libs/person/name/');
            });

            it('should support nested urls', function () {
                var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
                ds.load('first/name');

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/data/forio/js-libs/person/first/name/');
            });

            it('should support url parameters', function () {
                var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
                ds.load('first/name', {page: 1});

                var req = server.requests.pop();
                req.url.should.equal('https://api.forio.com/data/forio/js-libs/person/first/name/?page=1');
            });
        });
    });
}());
