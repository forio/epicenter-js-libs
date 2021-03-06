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
        server.respondWith('GET', /.*\/run\/(.*)\/(.*)\/\?(.*)/, function (xhr, base, filter, qs) {
            const headers = { 'Content-Type': 'application/json' };
            const runs = filter.indexOf('noruns') === -1 ? [{ id: 'existingRunI', url: xhr.url, filter: filter }] : [];
            if (filter.indexOf('tracker-with-run-limit') !== -1) {
                headers['content-range'] = '0-0/100';
            }

            xhr.respond(200, headers, JSON.stringify(runs));
            return true;
        });
        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });
    afterEach(function () {
        server.requests = [];
    });

    describe('#getRun', ()=> {
        it('should throw an error with invalid settings', ()=> {
            const rs = new RunService(runOptions);
            const settingsFetcher = sinon.spy(()=> {
                return $.Deferred().resolve({ a: 1 }).promise();
            });
            const strategy = new Strategy({
                strategyOptions: {
                    settings: settingsFetcher
                }
            });

            return strategy.getRun(rs).catch((err)=> {
                expect(err.type).to.equal(Strategy.errors.NO_TRACKING_KEY);
            });
        });
        it('should return existing run if found', ()=> {
            const rs = new RunService(runOptions);
            const settingsFetcher = sinon.spy(()=> {
                return $.Deferred().resolve({ trackingKey: 'tracker' }).promise();
            });
            const strategy = new Strategy({
                strategyOptions: {
                    settings: settingsFetcher
                }
            });

            return strategy.getRun(rs).then((run)=> {
                expect(run.id).to.equal('existingRunI');
            });
        });
        it('should create if no runs found', ()=> {
            const rs = new RunService(runOptions);
            const createSub = sinon.stub(rs, 'create').callsFake(()=> ($.Deferred().resolve({ id: 'newrunid' }).promise()));
            const strategy = new Strategy({
                strategyOptions: {
                    settings: {
                        trackingKey: 'noruns'
                    }
                }
            });
            return strategy.getRun(rs).then((run)=> {
                expect(createSub).to.have.been.calledOnce;
                expect(run.id).to.equal('newrunid');
            });
        });
        it('should create if latest run is trashed', ()=> {
            const rs = new RunService(runOptions);
            const createSub = sinon.stub(rs, 'create').callsFake(()=>
                ($.Deferred().resolve({ id: 'newrunid' }).promise()));
            const queryStub = sinon.stub(rs, 'query').callsFake(function () {
                return $.Deferred().resolve([{
                    id: 'run1',
                    date: '2016-10-21T00:07:55.735Z',
                    trashed: true,
                    scope: {
                        trackingKey: 'tracker',
                    }
                }]);
            });
            const settingsFetcher = sinon.spy(()=> {
                return $.Deferred().resolve({ trackingKey: 'tracker' }).promise();
            });
            const strategy = new Strategy({
                strategyOptions: {
                    settings: settingsFetcher
                }
            });
            return strategy.getRun(rs).then((run)=> {
                expect(createSub).to.have.been.calledOnce;
                expect(run.id).to.equal('newrunid');
            });
        });
        it('should pass options to create stub', ()=> {
            const opts = Object.assign({}, runOptions, { files: ['a'] });
            const rs = new RunService(opts);
            const createSub = sinon.stub(rs, 'create').callsFake(()=> ($.Deferred().resolve({ id: 'newrunid' }).promise()));
            const strategy = new Strategy({
                strategyOptions: {
                    settings: {
                        trackingKey: 'noruns'
                    }
                }
            });
            return strategy.getRun(rs, auth).then((run)=> {
                expect(createSub).to.have.been.calledOnce;
                const args = createSub.getCall(0).args[0];
                const knownArgs = pick(args, ['model', 'scope', 'files']);
                expect(knownArgs).to.eql({
                    model: runOptions.model,
                    scope: {
                        trackingKey: 'noruns',
                        group: auth.groupName
                    },
                    files: opts.files
                });
            });
        });

        it('should return the relevant settings as a property on the run, if no runs found', ()=> {
            const rs = new RunService(runOptions);
            const createSub = sinon.stub(rs, 'create').callsFake(()=> ($.Deferred().resolve({ id: 'newrunid' }).promise()));
            const strategy = new Strategy({
                strategyOptions: {
                    settings: {
                        trackingKey: 'noruns',
                        foo: 'bar'
                    }
                }
            });
            return strategy.getRun(rs).then((run)=> {
                expect(run.settings.foo).to.equal('bar');
            });
        });
        it('should return the relevant settings as a property on the run, if existing runs', ()=> {
            const rs = new RunService(runOptions);
            const strategy = new Strategy({
                strategyOptions: {
                    settings: {
                        trackingKey: 'existingruns',
                        foo: 'bar'
                    }
                }
            });
            return strategy.getRun(rs).then((run)=> {
                expect(run.settings.foo).to.equal('bar');
            });
        });
        it('should pass any filters to query', ()=> {
            const rs = new RunService(runOptions);
            const queryStub = sinon.stub(rs, 'query').callsFake(()=> {
                return $.Deferred().resolve([{ id: 'myrun1' }]).promise();
            });
            const strategy = new Strategy({
                strategyOptions: {
                    settings: {
                        trackingKey: 'noruns',
                    },
                    filter: {
                        saved: true
                    }
                }
            });
            return strategy.getRun(rs).then((run)=> {
                expect(queryStub).to.have.been.calledOnce;
                const filterArgs = queryStub.getCall(0).args[0];
                expect(filterArgs).to.eql({
                    scope: {
                        trackingKey: 'noruns',
                    },
                    saved: true,
                    trashed: false,
                });
            });
        });
    });
    describe('#reset', function () {
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
                    expect(err.type).to.equal(Strategy.errors.NO_TRACKING_KEY);
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

            it('should return the relevant settings as a property on the run', ()=> {
                const settingsFetcher = sinon.spy(()=> {
                    return $.Deferred().resolve({ trackingKey: 'tracker', foo: 'bar' }).promise();
                });
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: settingsFetcher
                    }
                });
                return strategy.reset(rs, auth).then((run)=> {
                    expect(run.settings.foo).to.equal('bar');
                });
            });
        });

        describe('Run limit', ()=> {
            it('should throw an error if runs exceed limit', ()=> {
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: {
                            trackingKey: 'tracker-with-run-limit',
                            runLimit: 1
                        }
                    }
                });
                return strategy.reset(rs, auth).catch((e)=> {
                    expect(e.type).to.equal(Strategy.errors.RUN_LIMIT_REACHED);
                    expect(createStub).to.not.have.been.called;
                });
            });
            it('should call create if runs are lower than limit', ()=> {
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: {
                            trackingKey: 'tracker-with-run-limit',
                            runLimit: 1000
                        }
                    }
                });
                return strategy.reset(rs, auth).then((e)=> {
                    expect(createStub).to.have.been.calledOnce;
                });
            });
            it('should pass any filters to query', ()=> {
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: {
                            trackingKey: 'tracker-with-run-limit',
                            runLimit: 1000
                        },
                        filter: {
                            foo: 'bar'
                        }
                    }
                });
                return strategy.reset(rs, auth).then((run)=> {
                    const req = server.requests[0];
                    expect(req.url.indexOf(';foo=bar')).to.not.equal(-1);
                    expect(req.url.indexOf(';trashed=false')).to.not.equal(-1);
                });
            });
        });
        describe('#onCreate', ()=> {
            it('should call onCreate with resolved settings', ()=> {
                const postCreateSpy = sinon.spy(()=> ({ a: 1 }));
                const settings = {
                    trackingKey: 'tracker',
                    foo: 'ba1',
                    runLimit: 1000,
                    a: '1'
                };
                const strategy = new Strategy({
                    strategyOptions: {
                        settings: settings,
                        onCreate: postCreateSpy
                    }
                });
                return strategy.reset(rs, auth).then((run)=> {
                    expect(createStub).to.have.been.calledOnce;
                    expect(postCreateSpy).to.have.been.calledOnce;

                    const args = postCreateSpy.getCall(0).args;
                    expect(args[0]).to.be.instanceof(RunService);
                    expect(args[1]).to.be.eql(settings);
                });
            });
        });
    });
});