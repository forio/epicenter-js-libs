/* global describe, it */

(function () {
    'use strict';

    describe('Query Utils', function () {
        describe('#toMatrixFormat()', function () {
            it('should convert single-key objects to string', function () {
                F.Query.toMatrixFormat({a: 2}).should.equal(';a=2');
            });
            it('should convert multi-key objects to semicolon-seperated values', function () {
                F.Query.toMatrixFormat({a: 2, b: 3}).should.equal(';a=2;b=3');
            });
        });
    });
})();
