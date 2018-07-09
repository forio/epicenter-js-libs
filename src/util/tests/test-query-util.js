
import { toMatrixFormat, normalizeSlashes, toQueryFormat, qsToObject, mergeQS, addTrailingSlash } from '../query-util';

describe('Query Util', function () {
    describe('#toMatrixFormat()', function () {
        it('should convert single-key objects to string', function () {
            toMatrixFormat({ a: 2 }).should.equal(';a=2');
        });
        it('should convert multi-key objects to semicolon-seperated values', function () {
            toMatrixFormat({ a: 2, b: 3 }).should.equal(';a=2;b=3');
        });
        it('should convert arithmetic operators', function () {
            toMatrixFormat({ a: 2, b: '<3' }).should.equal(';a=2;b<3');
            toMatrixFormat({ a: 2, b: '>3' }).should.equal(';a=2;b>3');
            toMatrixFormat({ a: 2, b: '!=3' }).should.equal(';a=2;b!=3');
            toMatrixFormat({ a: 2, b: '>=3' }).should.equal(';a=2;b>=3');
            toMatrixFormat({ a: 2, b: '<=3' }).should.equal(';a=2;b<=3');
        });
        it('should handle nulls', function () {
            toMatrixFormat(undefined).should.equal(';');
        });
        it('should leave strings as is', function () {
            toMatrixFormat('a=b').should.equal('a=b');
        });
    });

    describe('#toQueryFormat()', function () {
        it('should convert single-key objects to string', function () {
            toQueryFormat({ a: 2 }).should.equal('a=2');
        });
        it('should convert multi-key objects to semicolon-seperated values', function () {
            toQueryFormat({ a: 2, b: 3 }).should.equal('a=2&b=3');
        });
        it('should convert array values to comma seperated', function () {
            toQueryFormat({ a: 1, b: [2, 3, 4] }).should.equal('a=1&b=2,3,4');
        });
        it('should convert object values to stringified', function () {
            //Mostly for data api
            toQueryFormat({ a: 1, b: [2, 3, 4], c: { hello: 'world' } }).should.equal('a=1&b=2,3,4&c={"hello":"world"}');
        });
        it('should handle nulls', function () {
            toQueryFormat(undefined).should.equal('');
        });
        it('should leave strings as is', function () {
            toQueryFormat('a=b').should.equal('a=b');
        });
    });

    describe('#qsToObject()', function () {
        it('should convert single strings', function () {
            qsToObject('a=b').should.deep.equal({ a: 'b' });
        });
        it('should convert multi strings', function () {
            qsToObject('a=b&c=d').should.deep.equal({ a: 'b', c: 'd' });
        });
        it('should convert multi strings with arrays', function () {
            //Deep equal doesn't work on arrays with objects
            JSON.stringify(qsToObject('a=b&c=d&arr=1,2,3')).should.equal(JSON.stringify({ a: 'b', c: 'd', arr: ['1', '2', '3'] }));
        });
    });

    describe('#mergeQS()', function () {
        it('should convert merge strings', function () {
            mergeQS('a=b', 'c=d').should.deep.equal({ a: 'b', c: 'd' });
        });
        it('should merge objects', function () {
            mergeQS({ a: 'b' }, { c: 'd' }).should.deep.equal({ a: 'b', c: 'd' });
        });
        it('should merge strings and objects', function () {
            mergeQS('a=b', { c: 'd' }).should.deep.equal({ a: 'b', c: 'd' });
        });
        it('should merge multi strings with objects with arrays', function () {
            //Deep equal doesn't work on arrays with objects
            JSON.stringify(mergeQS('a=b&c=d', { arr: [1, 2, 3] })).should.equal(JSON.stringify({ a: 'b', c: 'd', arr: ['1', '2', '3'] }));
        });
        it('should merge nulls', function () {
            mergeQS('a=b', null).should.deep.equal({ a: 'b' });
            mergeQS({ a: 'b' }, null).should.deep.equal({ a: 'b' });
            mergeQS(null, null).should.deep.equal({});
        });
    });

    describe('#addTrailingSlash', function () {
        it('should add slashes to urls without it', function () {
            addTrailingSlash('forio.com').should.equal('forio.com/');
        });
        it('should accept existing slashes', function () {
            addTrailingSlash('forio.com/').should.equal('forio.com/');
        });
        it('should no nothing for empty strings', function () {
            addTrailingSlash('').should.equal('');
        });
    });

    describe('#normalizeSlashes', ()=> {
        it('should no nothing for empty strings', function () {
            normalizeSlashes('').should.equal('');
        });
        describe('trailing: true', ()=> {
            it('should add slashes to urls without it', function () {
                normalizeSlashes('forio.com', { trailing: true }).should.equal('forio.com/');
                normalizeSlashes('forio.com/foobar', { trailing: true }).should.equal('forio.com/foobar/');
                normalizeSlashes('https://forio.com/foobar', { trailing: true }).should.equal('https://forio.com/foobar/');
            });
            it('should accept existing slashes', function () {
                normalizeSlashes('forio.com/', { trailing: true }).should.equal('forio.com/');
                normalizeSlashes('forio.com/foobar/', { trailing: true }).should.equal('forio.com/foobar/');
                normalizeSlashes('https://forio.com/foobar/', { trailing: true }).should.equal('https://forio.com/foobar/');
            });
        });
        describe('leading: true', ()=> {
            it('should add slashes to urls without it', function () {
                normalizeSlashes('forio.com', { leading: true }).should.equal('/forio.com');
                normalizeSlashes('https://forio.com/foobar', { leading: true }).should.equal('https://forio.com/foobar');
            });
            it('should accept existing slashes', function () {
                normalizeSlashes('/forio.com/', { leading: true }).should.equal('/forio.com/');
            });
        });
        it('should replace multiple slashes', ()=> {
            normalizeSlashes('https://forio.com///foobar').should.equal('https://forio.com/foobar');
            normalizeSlashes('forio.com//foobar').should.equal('forio.com/foobar');
            normalizeSlashes('forio.com/foobar///').should.equal('forio.com/foobar/');
        });
    });
});
