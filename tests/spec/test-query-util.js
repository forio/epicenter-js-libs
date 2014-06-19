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
                qutils.toQueryFormat({a: 2}).should.equal('a=2');
            });
            it('should convert multi-key objects to semicolon-seperated values', function () {
                qutils.toQueryFormat({a: 2, b: 3}).should.equal('a=2&b=3');
            });
            it('should convert array values to comma seperated', function () {
                qutils.toQueryFormat({a:1, b:[2,3,4]}).should.equal('a=1&b=2,3,4');
            });
            it('should convert object values to stringified', function () {
                //Mostly for data api
                qutils.toQueryFormat({a:1, b:[2,3,4], c: {hello: 'world'}}).should.equal('a=1&b=2,3,4&c={"hello":"world"}');
            });
            it('should handle nulls', function () {
                qutils.toQueryFormat().should.equal('');
            });
        });
    });
})();
