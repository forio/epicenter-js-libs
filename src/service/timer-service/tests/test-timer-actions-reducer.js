import reduceActions from '../timer-actions-reducer';
import { ACTIONS } from '../timer-constants';

import { expect } from 'chai';


describe('Timer Service #reduceActions', function () {
    function createAction(type, time) {
        return { type: type, time: time, user: {} };
    }
  
    it('should return empty object if nothing passed in', function () {
        expect(reduceActions([], 0)).to.eql({});
        expect(reduceActions(undefined, 0)).to.eql({});
        expect(reduceActions(null, 0)).to.eql({});
    });
        
    describe('#isPaused', function () {
        it('should return false if not paused', function () {
                
        });
        it('should return true if paused', function () {
                
        });
        it('should return false if paused and resumed', function () {
                           
        });
        it('should return false if paused and resumed multiple times', function () {
                           
        });
    });
    describe('#elapsed', function () {
        it('should return 0 if not started', function () {
            var currentTime = 120;
            var actions = [
                createAction(ACTIONS.CREATE, 100),
            ];
            var op = reduceActions(actions, 0, currentTime);
            expect(op.elapsed.time).to.equal(0);
        });
        it('should return time from start if not paused', function () {
            var currentTime = 120;
            var startTime = 50;
            var actions = [
                createAction(ACTIONS.CREATE, 0),
                createAction(ACTIONS.START, startTime),
            ];
            var op = reduceActions(actions, startTime, currentTime);
            expect(op.elapsed.time).to.equal(currentTime - startTime);
        });
        it('should return time elapsed until pause if paused', function () {
            var startTime = 50;
            var actions = [
                createAction(ACTIONS.CREATE, 0),
                createAction(ACTIONS.START, startTime),
                createAction(ACTIONS.PAUSE, startTime + 100),
            ];
            var op = reduceActions(actions, startTime, startTime + 500);
            expect(op.elapsed.time).to.equal(100);
        });
        it('should return time elapsed until first pause if multiple conseq pauses', function () {
            var startTime = 50;
            var actions = [
                createAction(ACTIONS.CREATE, 0),
                createAction(ACTIONS.START, startTime),
                createAction(ACTIONS.PAUSE, startTime + 100),
                createAction(ACTIONS.PAUSE, startTime + 800),
            ];
            var op = reduceActions(actions, startTime, startTime + 500);
            expect(op.elapsed.time).to.equal(100);
        });
        describe('#resume', function () {
            it('should start counting time after resume', function () {
                var startTime = 50;
                var firstPauseTime = 100;
                var firstResumeTime = 300;

                var actions = [
                    createAction(ACTIONS.CREATE, 0),
                    createAction(ACTIONS.START, startTime),
                    createAction(ACTIONS.PAUSE, firstPauseTime),
                    createAction(ACTIONS.RESUME, firstResumeTime),
                ];
                    
                var currentTime = 650;
                var op = reduceActions(actions, startTime, currentTime);
                expect(op.elapsed.time).to.equal((currentTime - startTime) + (firstPauseTime - firstResumeTime));
            });
            it('should count multiple pause times', function () {
                var startTime = 50;
                var times = [100, 300, 500, 650];

                var actions = [
                    createAction(ACTIONS.CREATE, 0),
                    createAction(ACTIONS.START, startTime),
                    createAction(ACTIONS.PAUSE, times[0]),
                    // createAction(ACTIONS.PAUSE, times[0] + 50),
                    createAction(ACTIONS.RESUME, times[1]),
                    createAction(ACTIONS.PAUSE, times[2]),
                    createAction(ACTIONS.RESUME, times[3]),
                ];
                    
                var currentTime = 1000;
                var op = reduceActions(actions, startTime, currentTime);
                //50 - start to first pause +
                //200 - time between pause +
                //350 - current - last pause +
                expect(op.elapsed.time).to.equal(600);
            });
        });
    });
});