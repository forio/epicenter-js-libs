import ConsensusService from '../consensus-service';
import URLService from 'service/url-config-service';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

describe('Consensus Service', ()=> {
    const account = 'forio';
    const project = 'js-libs';
    const baseURL = (new URLService({ accountPath: account, projectPath: project })).getAPIPath('multiplayer/consensus');

    const defaultParams = {
        account: account,
        project: project,
        worldId: 'w1',
        consensusGroup: 'congroup',
        name: 'con',
    };

    var server;
    before(function () {
        server = sinon.fakeServer.create();
        server.respondWith(/(.*)\/consensus\/(.*)\/(.*)/, function (xhr, id) {
            xhr.respond(200, { 'Content-Type': 'application/json' }, JSON.stringify({ url: xhr.url }));
        });
        server.respondImmediately = true;
    });

    after(function () {
        server.restore();
    });

    it('should pass through string tokens', function () {
        const cs1 = new ConsensusService(Object.assign({}, defaultParams, { token: 'abc' }));
        cs1.create({ roles: ['a1'] });

        const req = server.requests.pop();
        expect(req.requestHeaders.Authorization).to.equal('Bearer abc');

        const cs2 = new ConsensusService(Object.assign({}, defaultParams, { token: '' }));
        cs2.create({ roles: ['a1'] });

        const req2 = server.requests.pop();
        expect(req2.requestHeaders.Authorization).to.not.exist;
    });
    it('should pass in transport options to the underlying ajax handler', function () {
        var beforeSend = sinon.spy();
        var complete = sinon.spy();
        var cs1 = new ConsensusService(Object.assign({}, defaultParams, { transport: { beforeSend: beforeSend, complete: complete } }));
        cs1.create({ roles: ['a1'] });

        expect(beforeSend).to.have.been.called;
        expect(complete).to.have.been.called;
    });


    describe('#create', ()=> {
        describe('roles', ()=> {
            it('should throw an error if no roles passed in', ()=> {
                const cs = new ConsensusService(defaultParams);
                expect(()=> cs.create()).to.throw(Error);
            });
            it('should take in object with roles', ()=> {
                const cs = new ConsensusService(defaultParams);
                const params = {
                    roles: {
                        a: 1,
                        b: 2
                    }
                };
                cs.create(params);
    
                var req = server.requests.pop();
                expect(req.requestBody).to.equal(JSON.stringify(params));
            });
            it('should take in a roles array and convert it', ()=> {
                const cs = new ConsensusService(defaultParams);
                const params = {
                    roles: ['a', 'b']
                };
                cs.create(params);
    
                var req = server.requests.pop();
                expect(req.requestBody).to.equal(JSON.stringify({
                    roles: {
                        a: 1,
                        b: 1
                    }
                }));
            });
        });
       
        it('should throw an error if world or name are not provided', ()=> {
            const cs = new ConsensusService({ account: account, project: project });
            expect(()=> cs.create({
                roles: ['a', 'b']
            }, { worldId: 'w1' })).to.throw(Error);

            expect(()=> cs.create({
                roles: ['a', 'b']
            }, { name: 'w1' })).to.throw(Error);
        });
        it('should do a POST to the right url', ()=> {
            const cs = new ConsensusService(defaultParams);
            cs.create({
                roles: ['a', 'b']
            });

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('POST');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should convert defaultActions to actions', ()=> {
            const cs = new ConsensusService(defaultParams);
            const opns = [{ name: 'foo', arguments: ['bar'] }, { name: 'foo2', arguments: ['bar2'] }];
            const opns2 = [{ name: 'foo3', arguments: ['bar3'] }, { name: 'foo4', arguments: ['bar4'] }];
            cs.create({
                roles: ['a', 'b'],
                defaultActions: {
                    a: opns,
                    b: opns2,
                }
            });

            var req = server.requests.pop();
            expect(req.requestBody).to.equal(JSON.stringify({
                roles: {
                    a: 1,
                    b: 1
                },
                actions: {
                    a: [{ execute: opns[0] }, { execute: opns[1] }],
                    b: [{ execute: opns2[0] }, { execute: opns2[1] }],
                }
            }));
        });
        it('should pass in other fields as-is', ()=> {
            const cs = new ConsensusService(defaultParams);
            const params = {
                roles: {
                    a: 1,
                    b: 2
                },
                ttlSeconds: 500,
                somethingElse: 'foobar'
            };
            cs.create(params);
            var req = server.requests.pop();
            expect(req.requestBody).to.equal(JSON.stringify(params));
        });
        it('should allow overriding serviceoptions', ()=> {
            
        });
    });
    describe('#load', ()=> {
        it('should do a GET to the right url', ()=> {
            const cs = new ConsensusService(defaultParams);
            cs.load();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('GET');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cs = new ConsensusService();
            cs.load(defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('GET');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
    });
    describe('#delete', ()=> {
        it('should do a GET to the right url', ()=> {
            const cs = new ConsensusService(defaultParams);
            cs.delete();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('DELETE');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cs = new ConsensusService();
            cs.delete(defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('DELETE');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
    });
    describe('#forceClose', ()=> {
        it('should do a POST to the right url', ()=> {
            const cs = new ConsensusService(defaultParams);
            cs.forceClose();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('POST');
            expect(req.url).to.equal(`${baseURL}close/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cs = new ConsensusService();
            cs.forceClose(defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('POST');
            expect(req.url).to.equal(`${baseURL}close/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should send in a blank body', ()=> {
            const cs = new ConsensusService();
            cs.forceClose(defaultParams);

            var req = server.requests.pop();
            expect(req.requestBody).to.equal(JSON.stringify({}));
        });
    });
    describe('#updateDefaults', ()=> {
        it('should throw an error if no actions passed in', ()=> {
            const cs = new ConsensusService(defaultParams);
            expect(()=> cs.updateDefaults()).to.throw(Error);
        });
        it('should do a PATCH to the right url', ()=> {
            const cs = new ConsensusService(defaultParams);
            const opns = [{ name: 'foo', arguments: ['bar'] }, { name: 'foo2', arguments: ['bar2'] }];
            
            cs.updateDefaults({ defaultActions: opns });

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('PATCH');
            expect(req.url).to.equal(`${baseURL}actions/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cs = new ConsensusService();
            const opns = [{ name: 'foo', arguments: ['bar'] }, { name: 'foo2', arguments: ['bar2'] }];
            
            cs.updateDefaults({ defaultActions: opns }, defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('PATCH');
            expect(req.url).to.equal(`${baseURL}actions/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should translate actions before passing in', ()=> {
            const cs = new ConsensusService(defaultParams);
            const opns = [{ name: 'foo', arguments: ['bar'] }, { name: 'foo2', arguments: ['bar2'] }];
            
            cs.updateDefaults({ defaultActions: opns });

            var req = server.requests.pop();
            expect(req.requestBody).to.equal(JSON.stringify({
                actions: [
                    { execute: opns[0] },
                    { execute: opns[1] },
                ] }));
            
        });
    });
    describe('#submitActions', ()=> {
        it('should throw an error if no roles passed in', ()=> {
            const cs = new ConsensusService(defaultParams);
            expect(()=> cs.submitActions()).to.throw(Error);
        });
        it('should do a POST to the right url', ()=> {
            const cs = new ConsensusService(defaultParams);
            const opns = [{ name: 'foo', arguments: ['bar'] }, { name: 'foo2', arguments: ['bar2'] }];
            
            cs.submitActions(opns);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('POST');
            expect(req.url).to.equal(`${baseURL}actions/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cs = new ConsensusService();
            const opns = [{ name: 'foo', arguments: ['bar'] }, { name: 'foo2', arguments: ['bar2'] }];
            
            cs.submitActions(opns, defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('POST');
            expect(req.url).to.equal(`${baseURL}actions/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should translate actions before passing in', ()=> {
            const cs = new ConsensusService(defaultParams);
            const opns = [{ name: 'foo', arguments: ['bar'] }, { name: 'foo2', arguments: ['bar2'] }];
            
            cs.submitActions(opns);

            var req = server.requests.pop();
            expect(req.requestBody).to.equal(JSON.stringify({
                actions: [
                    { execute: opns[0] },
                    { execute: opns[1] },
                ] }));
            
        });
    });
    describe('#undoSubmit', ()=> {
        it('should do a DELETE to the right url', ()=> {
            const cs = new ConsensusService(defaultParams);
            cs.undoSubmit();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('DELETE');
            expect(req.url).to.equal(`${baseURL}actions/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cs = new ConsensusService();
            cs.undoSubmit(defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('DELETE');
            expect(req.url).to.equal(`${baseURL}actions/${defaultParams.worldId}/${defaultParams.consensusGroup}/${defaultParams.name}`);
        });
    });
});