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
            it('should convert arithmetic operators', function () {
                qutils.toMatrixFormat({a: 2, b: '<3'}).should.equal(';a=2;b<3');
                qutils.toMatrixFormat({a: 2, b: '>3'}).should.equal(';a=2;b>3');
                qutils.toMatrixFormat({a: 2, b: '!=3'}).should.equal(';a=2;b!=3');
                qutils.toMatrixFormat({a: 2, b: '>=3'}).should.equal(';a=2;b>=3');
                qutils.toMatrixFormat({a: 2, b: '<=3'}).should.equal(';a=2;b<=3');
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
            it('should leave strings as is', function () {
                qutils.toQueryFormat('a=b').should.equal('a=b');
            });
        });

        describe('#qsToObject()', function () {
            it('should convert single strings', function () {
                qutils.qsToObject('a=b').should.deep.equal({a:'b'});
            });
            it('should convert multi strings', function () {
                qutils.qsToObject('a=b&c=d').should.deep.equal({a:'b', c:'d'});
            });
            it('should convert multi strings with arrays', function () {
                //Deep equal doesn't work on arrays with objects
                JSON.stringify(qutils.qsToObject('a=b&c=d&arr=1,2,3')).should.equal(JSON.stringify({a:'b', c:'d', arr: ['1','2','3']}));
            });
        });

        describe('#mergeQS()', function () {
            it('should convert merge strings', function () {
                qutils.mergeQS('a=b', 'c=d').should.deep.equal({a:'b', c:'d'});
            });
            it('should merge objects', function () {
                qutils.mergeQS({a:'b'}, {c:'d'}).should.deep.equal({a:'b', c:'d'});
            });
            it('should merge strings and objects', function () {
                qutils.mergeQS('a=b', {c: 'd'}).should.deep.equal({a:'b', c:'d'});
            });
            it('should merge multi strings with objects with arrays', function () {
                //Deep equal doesn't work on arrays with objects
                JSON.stringify(qutils.mergeQS('a=b&c=d', {arr: [1,2,3]})).should.equal(JSON.stringify({a:'b', c:'d', arr: ['1','2','3']}));
            });
            it('should merge nulls', function () {
                qutils.mergeQS('a=b', null).should.deep.equal({a:'b'});
                qutils.mergeQS({a:'b'}, null).should.deep.equal({a:'b'});
                qutils.mergeQS(null, null).should.deep.equal({});
            });
        });
    });
})();
