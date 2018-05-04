import startReduce from '../start-on-all-users';
import { ACTIONS } from '../../timer-constants';

import { expect } from 'chai';

function makeStartAction(time, user) {
    return {
        type: ACTIONS.START,
        time: time,
        user: {
            userName: user
        }
    };
}
describe('Start on first user timer strategy', ()=> {
    it('should return 0 if not enough users joined', ()=> {
        const actions = [
            makeStartAction(100, 'a1')
        ];
        const op = startReduce(actions, { requiredUsernames: ['a1', 'a2'] });
        expect(op.startTime).to.equal(0);
    });
    it('should return 0 if same user joined multiple times', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(200, 'a1'),
        ];
        const op = startReduce(actions, { requiredUsernames: ['a1', 'a2'] });
        expect(op.startTime).to.equal(0);
    });
    it('should return start time if all required users join', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(200, 'a2')
        ];
        const op = startReduce(actions, { requiredUsernames: ['a1', 'a2'] });
        expect(op.startTime).to.equal(actions[1].time);
    });
    it('should return first start time after condition is met', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(200, 'a2'),
            makeStartAction(300, 'a2'),
        ];
        const op = startReduce(actions, { requiredUsernames: ['a1', 'a2'] });
        expect(op.startTime).to.equal(actions[1].time);
    });
    it('should ignore users not matching condition', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(300, 'a3'),
        ];
        const op = startReduce(actions, { requiredUsernames: ['a1', 'a2'] });
        expect(op.startTime).to.equal(0);
    });
});