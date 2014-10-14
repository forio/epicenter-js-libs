(function () {
    'use strict';

    var RunService = F.service.Run;

    describe('Run API Service', function () {
        var server;
        before(function () {
            server = sinon.fakeServer.create();
            server.respondWith('PATCH',  /(.*)\/run\/forio\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.respondWith('GET',  /(.*)\/run\/forio\/(.*)/, function (xhr, id){
                xhr.respond(200, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });
            server.respondWith('POST',  /(.*)\/run\/forio\/(.*)/,  function (xhr, id){
                var resp = {
                    'id': '065dfe50-d29d-4b55-a0fd-30868d7dd26c',
                    'model': 'model.vmf',
                    'account': 'mit',
                    'project': 'afv',
                    'saved': false,
                    'lastModified': '2014-06-20T04:09:45.738Z',
                    'created': '2014-06-20T04:09:45.738Z'
                };
                xhr.respond(201, { 'Content-Type': 'application/json'}, JSON.stringify(resp));
            });

            server.respondWith(/(.*)\/run\/failure\/(.*)/, function (xhr, id){
                xhr.respond(400, { 'Content-Type': 'application/json'}, JSON.stringify({url: xhr.url}));
            });

            server.autoRespond = true;
        });

        after(function () {
            server.restore();
        });

        describe('#do', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();

                var rs = new RunService({account: 'forio', project: 'js-libs', filter: {saved: true}});
                rs.do('add', [1,2], {success: cb1}).then(cb2);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();


                var rs = new RunService({account: 'failure', project: 'js-libs', filter: {saved: true}});
                rs.do('add', [1,2], {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });
        describe('#serial', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();

                var rs = new RunService({account: 'forio', project: 'js-libs', filter: {saved: true}});
                rs.serial([{first: [1,2]}, {second: [2,3]}], null, {success: cb1}).then(cb2);
                server.respond();
                server.respond();

                cb1.should.have.been.called;
                cb2.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();

                var rs = new RunService({account: 'failure', project: 'js-libs', filter: {saved: true}});
                rs.serial([{first: [1,2]}, {second: [2,3]}], null, {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });
        describe('#parallel', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();


                var rs = new RunService({account: 'forio', project: 'js-libs', filter: {saved: true}});
                rs.parallel([{first: [1,2]}, {second: [2,3]}], null, {success: cb1}).then(cb2);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();


                var rs = new RunService({account: 'failure', project: 'js-libs', filter: {saved: true}});
                rs.parallel([{first: [1,2]}, {second: [2,3]}], null, {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });

        describe('#create', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();

                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.create('model.jl', {success: cb1}).then(cb2);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();


                var rs = new RunService({account: 'failure', project: 'js-libs'});
                rs.create('model.jl', {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });
        describe('#query', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();

                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'}, {page: 1}, {success: cb1}).then(cb2);
                server.respond();

                cb1.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();


                var rs = new RunService({account: 'failure', project: 'js-libs'});
                rs.query({saved: true, '.price': '>1'}, {page: 1}, {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });
        describe('#filter', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();

                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.filter({saved: true, '.price': '>1'}, {page: 1}, {success: cb1}).then(cb2);
                server.respond();

                cb1.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();


                var rs = new RunService({account: 'failure', project: 'js-libs'});
                rs.filter({saved: true, '.price': '>1'}, {page: 1}, {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });
        describe('#load', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var rs = new RunService({account: 'forio', project: 'js-libs'});
                rs.load('myfancyrunid', {include: 'score'}, {success: cb1}).then(cb2);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();


                var rs = new RunService({account: 'failure', project: 'js-libs'});
                rs.load('myfancyrunid', {include: 'score'}, {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });
        describe('#save', function () {
            it('passes success callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();

                var rs = new RunService({account: 'forio', project: 'js-libs', filter: {saved: true} });
                rs.save({completed: true}, {success: cb1}).then(cb2);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.have.been.called;
            });
            it('passes error callbacks', function () {
                var cb1 = sinon.spy();
                var cb2 = sinon.spy();
                var cb3 = sinon.spy();


                var rs = new RunService({account: 'failure', project: 'js-libs', filter: {saved: true} });
                rs.save({completed: true}, {error: cb1}).fail(cb3);
                server.respond();

                cb1.should.have.been.called;
                cb2.should.not.have.been.called;
                cb3.should.have.been.called;
            });
        });

    });
})();
