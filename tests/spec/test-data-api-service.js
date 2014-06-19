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

        describe('#save', function () {
            it('Should do a POST', function () {
                var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
                ds.save('name', 'John');

                var req = server.requests.pop();
                req.method.toUpperCase().should.equal('POST');
            });
            it('Should send key,value requests in body', function () {
                var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
                ds.save('name', 'John');

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify({name: 'John'}));
            });

            it('Should send object requests in body', function () {
                var params = {fname: 'john', lname: 'smith'};
                var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
                ds.save(params);

                var req = server.requests.pop();
                req.requestBody.should.equal(JSON.stringify(params));
            });
        });

    describe('#remove', function () {
        it('Should do a DELETE', function () {
            var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
            ds.remove('name');

            var req = server.requests.pop();
            req.method.toUpperCase().should.equal('DELETE');
        });

        it('Should remove single keys from collection', function () {
            var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
            ds.remove('name');

            var req = server.requests.pop();
            req.url.should.equal('https://api.forio.com/data/forio/js-libs/person/name/');
        });

        it('Should remove multiple keys from collection', function () {
            var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
            ds.remove(['name', 'age']);

            var req = server.requests.pop();
            req.url.should.equal('https://api.forio.com/data/forio/js-libs/person/?id=name,age');
        });

        it('Should remove nested keys from collection', function () {
            var ds = new DataService({ root: 'person', account: 'forio', project: 'js-libs'});
            ds.remove('first/name');

            var req = server.requests.pop();
            req.url.should.equal('https://api.forio.com/data/forio/js-libs/person/first/name/');
        });

    });

    });
}());
