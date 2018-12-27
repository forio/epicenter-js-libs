
import RunManager from '../index';
import RunService from 'service/run-api-service';

import { STRATEGY_SESSION_KEY } from 'managers/key-names';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

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
describe('Run Manager', function () {
    describe('constructor options', function () {
        describe('run', function () {
            it('creates a run member property if passed in run options', function () {
                var rm = new RunManager({
                    strategy: 'always-new',
                    run: runOptions
                });
                expect(rm.run).to.be.instanceof(RunService);
            });
            it('creates a run member property if passed in a runservice', function () {
                var rs = new RunService(runOptions);
                var rm = new RunManager({
                    strategy: 'always-new',
                    run: rs
                });
                expect(rm.run).to.be.instanceof(RunService);
            });
            it('should throw an error if no run passed in', function () {
                expect(function () { new RunManager({ strategy: 'always-new' }); }).to.throw(Error);
            });
        });
        describe('strategy', function () {
            it('should allow passing in known strategy names', function () {
                expect(function () { new RunManager({ strategy: 'always-new', run: runOptions }); }).to.not.throw(Error);
            });
            it('should throw an error with unknown strategy names', function () {
                expect(function () { new RunManager({ strategy: 'booya', run: runOptions }); }).to.throw(Error);
            });
            it('should pick default strategy name if none provided', function () {
                expect(function () { new RunManager({ run: runOptions }); }).to.not.throw(Error);
            });
            it('should allow custom strategy functions', function () {
                var myStrategy = function () {
                    return {
                        getRun: sinon.spy(),
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                new RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
                expect(strategySpy.calledWithNew()).to.equal(true);
            });
            it('should throw an error if strategy doesn\'t match format', function () {
                var myStrategy = function () {
                    return {
                        a: sinon.spy(),
                        v: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                expect(function () { new RunManager({ strategy: strategySpy, run: runOptions }); }).to.throw(Error);
            });
            it('should pass through options to strategies', function () {
                var myStrategy = function () {
                    return {
                        getRun: sinon.spy(),
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                new RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                    someCustomOption: 'booo',
                });

                var args = strategySpy.getCall(0).args;
                expect(args[0].run).to.eql(runOptions);
                expect(args[0].someCustomOption).to.eql('booo');
            });
        });
    });

    describe('User Session', function () {
        describe('if required by strategy', function () {
            var rm;
            beforeEach(function () {
                var runid = 'dummyrunid';
                var getRunSpy = sinon.spy(function () {
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var myStrategy = function () {
                    return {
                        getRun: getRunSpy,
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                strategySpy.requiresAuth = true;
                rm = new RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
                sinon.stub(rm.sessionManager, 'getSession').returns({});
            });

            it('#getRun throw an error if strategy requires auth but it\'s not given', function () {
                var successSpy = sinon.spy();
                var failSpy = sinon.spy();
                return rm.getRun().then(successSpy).catch(failSpy).then(function () {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.called;
                });
            });

            it('#reset throw an error if strategy requires auth but it\'s not given', function () {
                var successSpy = sinon.spy();
                var failSpy = sinon.spy();
                return rm.reset().then(successSpy).catch(failSpy).then(function () {
                    expect(successSpy).to.not.have.been.called;
                    expect(failSpy).to.have.been.called;
                });
            });
        });
        it('should pass in session to #getRun', function () {
            var runid = 'dummyrunid';
            var getRunSpy = sinon.spy(function () {
                return $.Deferred().resolve({ id: runid }).promise();
            });
            var myStrategy = function () {
                return {
                    getRun: getRunSpy,
                    reset: sinon.spy(),
                };
            };
            var strategySpy = sinon.spy(myStrategy);
            var rm = new RunManager({
                strategy: strategySpy,
                run: runOptions,
            });

            var sessionStub = sinon.stub(rm.sessionManager, 'getSession').returns(sampleSession);
            return rm.getRun().then(function () {
                expect(getRunSpy.getCall(0).args[1]).to.eql(sampleSession);
                sessionStub.restore();
            });
        });
        it('should pass in session to #reset', function () {
            var runid = 'dummyrunid';

            var resetSpy = sinon.spy(function () {
                return $.Deferred().resolve({ id: runid }).promise();
            });
            var myStrategy = function () {
                return {
                    getRun: sinon.spy(),
                    reset: resetSpy,
                };
            };
            var strategySpy = sinon.spy(myStrategy);
            var rm = new RunManager({
                strategy: strategySpy,
                run: runOptions,
            });
            var sessionStub = sinon.stub(rm.sessionManager, 'getSession').returns(sampleSession);
            return rm.reset().then(function () {
                expect(resetSpy.getCall(0).args[1]).to.eql(sampleSession);
                sessionStub.restore();
            });
        });
    });
    describe('Run Session', function () {
        var getSpy, setSpy, dummySessionStore, runSession = { id: 'dummyrunid' };
        beforeEach(function () {
            getSpy = sinon.spy(function (key) { 
                if (key !== 'missing-runid') {
                    return JSON.stringify(runSession);
                }
                return null;
            });
            setSpy = sinon.spy();

            dummySessionStore = {
                getSession: function () {
                    return {};
                },
                getStore: function () {
                    return {
                        get: getSpy,
                        set: setSpy,
                    };
                }
            };
        });

        it('should pass runid in session into strategy', function () {
            var getRunSpy = sinon.spy(function () {
                return $.Deferred().resolve(runSession).promise();
            });
            var myStrategy = function () {
                return {
                    getRun: getRunSpy,
                    reset: sinon.spy(),
                };
            };
            var strategySpy = sinon.spy(myStrategy);
            var rm = new RunManager({
                strategy: strategySpy,
                run: runOptions,
            });
            rm.sessionManager = dummySessionStore;
            return rm.getRun().then(function () {
                expect(getRunSpy.getCall(0).args[2]).to.eql(runSession);
            });
        });

        it('should update store with sessionkey name after run creation', function () {
            var createResponse = { id: 'samplerunid' };
            var rs = new RunService(runOptions);
            sinon.stub(rs, 'create').callsFake(function (options) {
                return $.Deferred().resolve(createResponse).promise();
            });
            sinon.stub(rs, 'load').callsFake(function (runid, filters, options) {
                options.success({ id: runid });
                return $.Deferred().resolve({ id: runid }).promise();
            });
            var rm = new RunManager({
                strategy: 'always-new',
                run: rs,
            });
            rm.sessionManager = dummySessionStore;
            return rm.getRun().then(function () {
                expect(setSpy).to.have.been.calledOnce;

                var args = setSpy.getCall(0).args;
                expect(JSON.parse(args[1]).id).to.eql('samplerunid');
            });
        });
        describe('custom session keys', function () {
            it('should set default session key', function () {
                var myStrategy = function () {
                    return {
                        getRun: sinon.spy(function () {
                            return $.Deferred().resolve({ id: 'runid' }).promise();
                        }),
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                var rm = new RunManager({
                    strategy: strategySpy,
                    run: runOptions,
                });
                rm.sessionManager = dummySessionStore;
                var defaultcookiekey = [
                    STRATEGY_SESSION_KEY, 
                    runOptions.account, 
                    runOptions.project, 
                    runOptions.model
                ].join('-');

                return rm.getRun().then(function () {
                    expect(getSpy.getCall(0).args[0]).to.equal(defaultcookiekey);
                    expect(setSpy.getCall(0).args[0]).to.equal(defaultcookiekey);
                });
            });
            it('should read from custom session keys', function () {
                var myStrategy = function () {
                    return {
                        getRun: sinon.spy(function () {
                            return $.Deferred().resolve({ id: 'runid' }).promise();
                        }),
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                var rm = new RunManager({
                    sessionKey: 'abc',
                    strategy: strategySpy,
                    run: runOptions,
                });
                rm.sessionManager = dummySessionStore;
                return rm.getRun().then(function () {
                    expect(setSpy.getCall(0).args[0]).to.equal('abc');
                });
            });
            it('should set custom session keys', function () {
                var sampleRunid = 'samplerunid';
                var rs = new RunService(runOptions);
                sinon.stub(rs, 'create').callsFake(function (options) {
                    return $.Deferred().resolve({
                        id: sampleRunid
                    }).promise();
                });
                sinon.stub(rs, 'load').callsFake(function (runid, filters, options) {
                    options.success({ id: runid });
                    return $.Deferred().resolve({ id: runid }).promise();
                });
                var rm = new RunManager({
                    sessionKey: 'abc',
                    strategy: 'always-new',
                    run: rs,
                });
                rm.sessionManager = dummySessionStore;
                return rm.getRun().then(function () {
                    expect(setSpy).to.have.been.calledOnce;

                    var args = setSpy.getCall(0).args;
                    expect(args[0]).to.equal('abc');
                    expect(JSON.parse(args[1]).id).to.equal(sampleRunid);
                });
            });
            it('should allow sessionkeys as functions', function () {
                var myStrategy = function () {
                    return {
                        getRun: sinon.spy(function () {
                            return $.Deferred().resolve({ id: 'runid' }).promise();
                        }),
                        reset: sinon.spy(),
                    };
                };
                var strategySpy = sinon.spy(myStrategy);
                var rm = new RunManager({
                    sessionKey: function () { return 'abc'; },
                    strategy: strategySpy,
                    run: runOptions,
                });
                rm.sessionManager = dummySessionStore;
                return rm.getRun().then(function () {
                    expect(setSpy.getCall(0).args[0]).to.equal('abc');
                    expect(getSpy.getCall(0).args[0]).to.equal('abc');
                });
            });
        });
            
    });
    describe('#getRun', function () {
        var rm, runid = 'newrun', getRunSpy, myStrategy, strategySpy;
        beforeEach(function () {
            getRunSpy = sinon.spy(function () {
                return $.Deferred().resolve({ id: runid }).promise();
            });
            myStrategy = function () {
                return {
                    getRun: getRunSpy,
                    reset: sinon.spy(),
                };
            };
            strategySpy = sinon.spy(myStrategy);
            rm = new RunManager({
                strategy: strategySpy,
                run: runOptions,
            });
        });
        it('should call the strategy\'s getRun', function () {
            return rm.getRun().then(function () {
                expect(getRunSpy).to.have.been.calledOnce;
            });
        });
        it('should combine simultaneous calls to getRun', ()=> {
            return Promise.all([rm.getRun(), rm.getRun()]).then((resArr)=> {
                expect(getRunSpy).to.have.been.calledOnce;
                expect(resArr[0]).to.eql({ id: runid });
            });
        });
        it('should not combine non-simultaneous calls to getRun', ()=> {
            return rm.getRun().then(()=> {
                return rm.getRun();
            }).then((res)=> {
                expect(getRunSpy).to.have.been.calledTwice;
                expect(res).to.eql({ id: runid });
            });
        });
        it('should be called with the right run service', function () {
            return rm.getRun().then(function () {
                expect(getRunSpy.getCall(0).args[0]).to.be.instanceof(RunService);
            });
        });
        it('should update current run instance after creation', function () {
            return rm.getRun().then(function () {
                var config = rm.run.getCurrentConfig();
                expect(config.id).to.equal(runid);
            });
        });
        describe('variables', function () {
            var rs, variableStub, rm;
            beforeEach(function () {
                rs = new RunService(runOptions);
                var variableQuerySpy = sinon.spy(function (v) {
                    const res = [].concat(v).reduce((accum, vName)=> {
                        accum[vName] = 2;
                        return accum;
                    }, {});
                    return $.Deferred().resolve(res).promise();
                });
                variableStub = sinon.stub(rs, 'variables').callsFake(function (options) {
                    return {
                        query: variableQuerySpy
                    };
                });
                rm = new RunManager({
                    strategy: myStrategy,
                    run: rs,
                });
            });
            it('should not call the variables service if no variables provided', function () {
                return rm.getRun().then(function () {
                    expect(variableStub).to.not.have.been.called;
                });
            });
            it('should combine simultaneous calls to getRun with variables', ()=> {
                return Promise.all([rm.getRun('price'), rm.getRun('sales')]).then((resArr)=> {
                    expect(getRunSpy).to.have.been.calledOnce;
                    expect(resArr[0]).to.eql({ 
                        id: runid,
                        variables: {
                            price: 2 
                        }
                    });
                });
            });
            it('should call variables service if variables provided', function () {
                return rm.getRun('price').then(function (run) {
                    expect(variableStub).to.have.been.calledOnce;

                    var args = rs.variables().query.getCall(0).args;
                    expect(args[0]).to.eql('price');
                    expect(run.variables).to.eql({ price: 2 });
                });
            });
            
            it('should return a run with no variables if variables call fails', function () {
                var rs = new RunService(runOptions);
                var variableQuerySpy = sinon.spy(function () {
                    return $.Deferred().reject().promise();
                });
                variableStub = sinon.stub(rs, 'variables').callsFake(function (options) {
                    return {
                        query: variableQuerySpy
                    };
                });
                var rm = new RunManager({
                    strategy: myStrategy,
                    run: rs,
                });
                return rm.getRun('price').then(function (run) {
                    expect(variableStub).to.have.been.calledOnce;
                    expect(run.variables).to.eql({ });
                });
            });
        });
    });
    describe('#reset', function () {
        var rm, runid = 'resetrun', resetSpy;
        beforeEach(function () {
            resetSpy = sinon.spy(function () {
                return $.Deferred().resolve({ id: runid }).promise();
            });
            var myStrategy = function () {
                return {
                    getRun: sinon.spy(),
                    reset: resetSpy,
                };
            };
            var strategySpy = sinon.spy(myStrategy);
            rm = new RunManager({
                strategy: strategySpy,
                run: runOptions,
            });
        });
        it('should call the strategy\'s getRun', function () {
            return rm.reset().then(function () {
                expect(resetSpy).to.have.been.calledOnce;
            });
        });
        it('should be called with the right run service', function () {
            return rm.reset().then(function () {
                expect(resetSpy.getCall(0).args[0]).to.be.instanceof(RunService);
            });
        });
        it('should update current run instance after creation', function () {
            return rm.reset().then(function () {
                var config = rm.run.getCurrentConfig();
                expect(config.id).to.equal(runid);
            });
        });
        describe('When used as an operation', function () {
            var resetStub;
            beforeEach(function () {
                resetStub = sinon.stub(rm, 'reset').returns($.Deferred().resolve().promise());
            });
            afterEach(function () {
                resetStub.restore();
            });
            it('should patch `do` function of the run service to call the strategy reset', function () {
                return rm.run.do('reset').then(function () {
                    expect(resetStub).to.have.been.calledOnce;
                });
            });
            it('should pass on reset options', function () {
                var options = { success: 'yay' };
                return rm.run.do('reset', null, options).then(function () {
                    expect(resetStub).to.have.been.calledWith(options);
                });
            });
        });
    });
});