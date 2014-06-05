/* global describe, it */

(function () {
    'use strict';

    var qutils = F.util.query;

    describe('Query Util', function () {
        describe('#toMatrixFormat()', function () {
            it('should convert single-key objects to string', function () {
                qutils.toMatrixFormat({a: 2}).should.equal(';a=2');
            });
            it('should convert multi-key objects to semicolon-seperated values', function () {
                qutils.toMatrixFormat({a: 2, b: 3}).should.equal(';a=2;b=3');
            });
        });

        describe('#toQueryFormat()', function () {
            it('should convert single-key objects to string', function () {
                qutils.toMatrixFormat({a: 2}).should.equal('a=2');
            });
            it('should convert multi-key objects to semicolon-seperated values', function () {
                qutils.toMatrixFormat({a: 2, b: 3}).should.equal('a=2&b=3');
            });
        });
    });
})();
