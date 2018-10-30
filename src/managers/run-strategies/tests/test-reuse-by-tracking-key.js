import RunService from 'service/run-api-service';
import Strategy from '../reuse-by-tracking-key';

import sinon from 'sinon';
import chai, { expect } from 'chai';
import { pick } from 'util/object-util';
chai.use(require('sinon-chai'));

describe('Reuse by tracking key', function () {
    const runOptions = {
        model: 'model.eqn',
        account: 'forio-dev',
        project: 'js-libs'
    };
    const auth = {
        userId: 'user1',
        groupName: 'groupName'
    };

    let server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith('POST', /(.*)\/run\/[^/]*\/[^/]*\/$/, function (xhr, id) {
            const resp = Object.assign({}, runOptions, {
                id: 'newrunid',
            });
            xhr.respond(201, { 'Content-Type': 'application/json' }, JSON.stringify(resp));
        });
        server.respondWith('GET', /(.*)\/run\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ id: id, url: xhr.url }));
            return true;
        });
        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });

    describe('#getRun', ()=> {
        it('should throw an error with invalid settings', ()=> {
            
        });
        it('should create if no runs found', ()=> {
            
        });
        it('should return existing run if found', ()=> {
            
        });
    });
    describe.only('#reset', function () {
        let rs, createStub;
        beforeEach(function () {
            rs = new RunService(runOptions);
            createStub = sinon.stub(rs, 'create').callsFake(function () {
                return $.Deferred().resolve({
                    id: 'newrun'
                }).promise();
            });
        });

        describe('Settings', ()=> {
            it('should throw an error if settings fetch fails', ()=> {
                const settingsFetcher = sinon.spy(()=> {
                    return $.Deferred().reject('SETTINGS_FETCH_FAIL').promise();
                });
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: settingsFetcher
                    }
                });
                return strategy.reset(rs).catch((err)=> {
                    expect(err).to.equal('SETTINGS_FETCH_FAIL');

                    expect(settingsFetcher).to.have.been.calledOnce;
                    expect(createStub).to.not.have.been.called;
                });
            });
            it('should throw an error with no tracking Key', ()=> {
                const settingsFetcher = sinon.spy(()=> {
                    return $.Deferred().resolve({ a: 1 }).promise();
                });
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: settingsFetcher
                    }
                });

                return strategy.reset(rs).catch((err)=> {
                    expect(err.message).to.equal(Strategy.errors.NO_TRACKING_KEY);
                    expect(settingsFetcher).to.have.been.calledOnce;
                    expect(createStub).to.not.have.been.called;
                });
            });
            it('should call rs.create with valid settings', ()=> {
                const settingsFetcher = sinon.spy(()=> {
                    return $.Deferred().resolve({ trackingKey: 'tracker' }).promise();
                });
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: settingsFetcher
                    }
                });
                return strategy.reset(rs).then((run)=> {
                    expect(settingsFetcher).to.have.been.calledOnce;
                    expect(createStub).to.have.been.calledOnce;

                    const createOpts = createStub.getCall(0).args[0];
                    const relevant = pick(createOpts, ['model', 'scope']);
                    expect(relevant).eql({
                        model: runOptions.model,
                        scope: {
                            trackingKey: 'tracker'
                        }
                    });

                    expect(run.id).to.equals('newrun');
                });
            });
            it('should inject group scope from session', ()=> {
                const settingsFetcher = sinon.spy(()=> {
                    return $.Deferred().resolve({ trackingKey: 'tracker' }).promise();
                });
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: settingsFetcher
                    }
                });
                return strategy.reset(rs, auth).then((run)=> {
                    expect(settingsFetcher).to.have.been.calledOnce;
                    expect(createStub).to.have.been.calledOnce;

                    const createOpts = createStub.getCall(0).args[0];
                    const relevant = pick(createOpts, ['model', 'scope']);
                    expect(relevant).eql({
                        model: runOptions.model,
                        scope: {
                            group: auth.groupName,
                            trackingKey: 'tracker'
                        }
                    });
                });
            });
        });
        
        describe('Run limit', ()=> {
            it('should throw an error if runs exceed limit', ()=> {
            
            });
            it('should call create if runs are lower than limit', ()=> {
                
            });
        });
        describe('Create options', ()=> {
            it('should call onCreate with resolved settings', ()=> {
                
            });
        });
        it('should pass in the right auth params', function () {
            // return strategy.reset(rs, { groupName: 'group-123' }).then(function () {
            //     const args = createStub.getCall(0).args;
            //     expect(args[0].scope).to.eql({ group: 'group-123' });
            // });
        });
    });
});