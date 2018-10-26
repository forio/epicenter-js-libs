import Strategy from '../use-specific-run-strategy';
import chai, { expect } from 'chai';
import sinon from 'sinon';
chai.use(require('sinon-chai'));

describe('Use Specific Run Strategy', ()=> {
    it('should throw an error if initialized without a run id', ()=> {
        const create = ()=> new Strategy();
        expect(create).to.throw(/Missing required parameter/i);
    });
    it('#reset: should throw an error', ()=> {
        const strategy = new Strategy({ strategyOptions: {
            runId: 'myrun'
        } });
        expect(strategy.reset).to.throw(/does not support reset/i);
    });
    it('#getRun: should load given run id', ()=> {
        const strategy = new Strategy({ strategyOptions: {
            runId: 'myrun'
        } });
        const runStub = { load: sinon.spy(()=> Promise.resolve()) };
        return strategy.getRun(runStub).then(()=> {
            expect(runStub.load).to.have.been.calledOnce;
            expect(runStub.load).to.have.been.calledWith('myrun');
        });
    });
});