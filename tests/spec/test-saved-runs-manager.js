(function () {
    'use strict';

    var SavedRunsManager = F.manager.SavedRunsManager;
    var RunService = F.service.Run;

    var runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs',
    };

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
            var rs, saveStub, srm;
            beforeEach(function () {
                rs = new RunService(runOptions);
                saveStub = sinon.stub(rs, 'save', function (params) {
                    return $.Deferred().resolve(params).promise();
                });
                srm = new SavedRunsManager({
                    run: runOptions
                });
            });
            it('should call the run service with the right saved flag', function () {
                return srm.save(rs).then(function () {
                    expect(saveStub).to.have.been.calledOnce;

                    var args = saveStub.getCall(0).args;
                    expect(args[0]).to.eql({ saved: true, trashed: false });
                });
            });
        });
    });
}());