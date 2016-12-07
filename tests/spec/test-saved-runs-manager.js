(function () {
    'use strict';

    var SavedRunsManager = F.manager.SavedRunsManager;
    var RunService = F.service.Run;

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs',
    };

    var baseURL = (new F.service.URL({ accountPath: runOptions.account, projectPath: runOptions.project })).getAPIPath('run');

    var sampleSession = {
        auth_token: '',
        account: 'forio-dev',
        project: 'js-libs',
        userId: '123',
        groupId: 'group123',
        groupName: 'group-123',
        isFac: false
    };
    var fakeAuth = {
        // get should return what's stored in the session cookie
        getCurrentUserSessionInfo: sinon.stub().returns(sampleSession)
    };
    var fakeInvalidAuth = {
        // get should return what's stored in the session cookie
        getCurrentUserSessionInfo: sinon.stub().returns({})
    };
    describe.only('Saved Runs Manager', function () {
        var server;
        var rs, saveStub, srm;

        beforeEach(function () {
            server = sinon.fakeServer.create();
            server.respondWith('PATCH', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
                xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
            });
            server.respondImmediately = true;

            rs = new RunService(runOptions);
            saveStub = sinon.stub(rs, 'save', function (params) {
                return $.Deferred().resolve(params).promise();
            });
            srm = new SavedRunsManager({
                run: runOptions
            });
        });

        afterEach(function () {
            server.restore();
        });
        describe('constructor options', function () {
            describe('run', function () {
                it('creates a run member property if passed in run options', function () {
                    var srm = new SavedRunsManager({
                        run: runOptions
                    });
                    expect(srm.runService).to.be.instanceof(RunService);
                });
                it('creates a run member property if passed in a runservice', function () {
                    var rs = new RunService(runOptions);
                    var srm = new SavedRunsManager({
                        run: rs
                    });
                    expect(srm.runService).to.be.instanceof(RunService);
                });
                it('should throw an error if no run passed in', function () {
                    expect(function () { new SavedRunsManager({ }); }).to.throw(Error);
                });
            });
        });

        describe('User Session', function () {
            //Test to make sure the right session ids are set
        });

        describe('#save', function () {
            it('should call the run service with the right flags', function () {
                return srm.save(rs).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: true, trashed: false });
                });
            });
            it('should allow passing in additonal fields', function () {
                return srm.save(rs, { name: 'foo' }).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: true, trashed: false, name: 'foo' });
                });
            });
            it('allow passing in string runids', function () {
                return srm.save('food', { name: 'foo' }).then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'food/');
                    expect(JSON.parse(req.requestBody)).to.eql({ saved: true, trashed: false, name: 'foo' });
                });
            });
            it('should throw an error for invalid run service provided', function () {
                expect(function () { srm.save(); }).to.throw(Error);
            });
        });
        describe('#remove', function () {
            it('should call the run service with the right flags', function () {
                return srm.remove(rs).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: false, trashed: true });
                });
            });
            it('should allow passing in additonal fields', function () {
                return srm.remove(rs, { name: 'foo' }).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: false, trashed: true, name: 'foo' });
                });
            });
            it('allow passing in string runids', function () {
                return srm.remove('food', { name: 'foo' }).then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'food/');
                    expect(JSON.parse(req.requestBody)).to.eql({ saved: false, trashed: true, name: 'foo' });
                });
            });
            it('should throw an error for invalid run service provided', function () {
                expect(function () { srm.remove(); }).to.throw(Error);
            });
        });
        describe('#mark', function () {
            it('should call the run service with the right flags', function () {
                return srm.mark(rs, { foo: 'bar' }).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ foo: 'bar' });
                });
            });
            it('allow passing in string runids', function () {
                return srm.mark('food', { name: 'foo' }).then(function () {
                    var req = server.requests.pop();
                    req.url.should.equal(baseURL + 'food/');
                    expect(JSON.parse(req.requestBody)).to.eql({ name: 'foo' });
                });
            });
            it('should throw an error for invalid run service provided', function () {
                expect(function () { srm.mark(); }).to.throw(Error);
            });
        });
    });
}());