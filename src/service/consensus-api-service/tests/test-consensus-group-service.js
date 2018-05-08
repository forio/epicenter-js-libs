import ConsensusGroupService from '../consensus-group-service';
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
    };

    function createConsensusGroupService(params) {
        return new ConsensusGroupService(Object.assign({}, defaultParams, params));
    }
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
        const cs1 = createConsensusGroupService({ token: 'abc' });
        cs1.list();

        const req = server.requests.pop();
        expect(req.requestHeaders.Authorization).to.equal('Bearer abc');

        const cs2 = createConsensusGroupService({ token: '' });
        cs2.list();

        const req2 = server.requests.pop();
        expect(req2.requestHeaders.Authorization).to.not.exist;
    });
    it('should pass in transport options to the underlying ajax handler', function () {
        var beforeSend = sinon.spy();
        var complete = sinon.spy();
        var cs1 = createConsensusGroupService({ transport: { beforeSend: beforeSend, complete: complete } });
        cs1.list();

        expect(beforeSend).to.have.been.called;
        expect(complete).to.have.been.called;
    });

    describe('#list', ()=> {
        it('should do a GET to default group if none provided', ()=> {
            const cg = createConsensusGroupService();
            cg.list();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('GET');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/default`);
        });
        it('should do a GET to specific group if none provided', ()=> {
            const cg = createConsensusGroupService({ name: 'mygroup' });
            cg.list();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('GET');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/mygroup`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cg = createConsensusGroupService();
            cg.list({}, defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('GET');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/default`);
        });
    });
    describe('#delete', ()=> {
        it('should do a DELETE to default group if none provided', ()=> {
            const cg = createConsensusGroupService();
            cg.delete();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('DELETE');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/default`);
        });
        it('should do a DELETE to specific group if none provided', ()=> {
            const cg = createConsensusGroupService({ name: 'mygroup' });
            cg.delete();

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('DELETE');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/mygroup`);
        });
        it('should allow overriding serviceoptions', ()=> {
            const cg = createConsensusGroupService();
            cg.delete(defaultParams);

            var req = server.requests.pop();
            expect(req.method.toUpperCase()).to.equal('DELETE');
            expect(req.url).to.equal(`${baseURL}${defaultParams.worldId}/default`);
        });
    });
    describe('#consensus', ()=> {
        it('should return a consensus service', function () {
            const consensus = createConsensusGroupService().consensus('foo');
            expect(consensus.create).to.exist; //not a proper instance so can't test that
        });
        it('should pass in current config', ()=> {
            const consensus = createConsensusGroupService().consensus();
            const config = consensus.getCurrentConfig();
            expect(config.account).to.equal(defaultParams.account);
            expect(config.project).to.equal(defaultParams.project);
        });
        it('should allow passing in name', ()=> {
            const consensus = createConsensusGroupService({ name: 'grpName' }).consensus('foobar');
            const config = consensus.getCurrentConfig();
            expect(config.name).to.equal('foobar');
            expect(config.consensusGroup).to.equal('grpName');
        });
    });
});