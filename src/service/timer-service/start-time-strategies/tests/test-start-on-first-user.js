import startReduce from '../start-on-first-user';
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
    it('should return start time of first user, if single user', ()=> {
        const actions = [
            makeStartAction(100, 'a1')
        ];
        const op = startReduce(actions);
        expect(op.startTime).to.equal(actions[0].time);
    });
    it('should return first start time if single user started it multiple times', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(200, 'a1')
        ];
        const op = startReduce(actions);
        expect(op.startTime).to.equal(actions[0].time);
    });
    it('should return first start time if second user joins', ()=> {
        const actions = [
            makeStartAction(100, 'a1'),
            makeStartAction(200, 'a1'),
            makeStartAction(300, 'a2'),
            makeStartAction(400, 'a2'),
        ];
        const op = startReduce(actions);
        expect(op.startTime).to.equal(actions[0].time);
    });
});