import reducer from '../start-when-user-condition';
import { ACTIONS } from '../../timer-constants';

import sinon from 'sinon';
import chai from 'chai';
chai.use(require('sinon-chai'));

const { expect } = chai;

function makeStartAction(time, user) {
    return {
        type: ACTIONS.START,
        time: time,
        user: {
            userName: user
        }
    };
}
describe('Start when user condition strategy', ()=> {
    var options;
    beforeEach(()=> {
        options = {
            condition: sinon.spy(function condition(userNames) {
                return userNames.length === 3;
            })
        };
    });
  
    it('should return 0 if not started', ()=> {
        const actions = [];
        const op = reducer(actions, options);
        expect(op.startTime).to.equal(0);
    });
    
    it('should call condition with joined users', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(100, 'a2'),
        ];
        reducer(actions, options);

        const condition = options.condition;
        expect(condition).to.have.been.calledTwice;

        const firstCall = condition.getCall(0);
        expect(firstCall.args[0]).to.eql([{ userName: 'a1' }]);      
        
        const secondCall = condition.getCall(1);
        expect(secondCall.args[0]).to.eql([{ userName: 'a1' }, { userName: 'a2' }]);      
    });

    it('should return startTime 0 if condition not satisfied', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(100, 'a2'),
            makeStartAction(100, 'a2'),
        ];
        const op = reducer(actions, options);
        expect(op.startTime).to.equal(0);
    });
    it('should return matching startTime if condition satisfied', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(500, 'a2'),
            makeStartAction(1500, 'a3'),
        ];
        const op = reducer(actions, options);
        expect(op.startTime).to.equal(actions[2].time);
    });
    it('should not update startTime after condition initially satisfied', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(500, 'a2'),
            makeStartAction(1500, 'a3'),
            makeStartAction(1600, 'a3'),
            makeStartAction(2500, 'a4'),
        ];
        const op = reducer(actions, options);
        expect(op.startTime).to.equal(actions[2].time);
    });
});