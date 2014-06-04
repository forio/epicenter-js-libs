/* global describe, it */

(function () {
    'use strict';

    describe('Give it some context', function () {
        describe('maybe a bit more context here', function () {
            it('should run here few assertions', function () {
                [1,2,3].indexOf(4).should.equal(-1);
            });
        });
    });
})();
