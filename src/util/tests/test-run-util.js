
import rutil from '../run-util';
import chai from 'chai';

describe('Run Utilities', function () {
    describe('#normalizeOperations()', function () {
        describe('#_normalizePlainObjects', function () {
            it('takes in multi anon object with [..]', function () {
                var params = { add: [1, 2], subtract: [2, 3] };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add', 'subtract'], args: [[1, 2], [2, 3]] });
            });
            it('takes in multi anon object with []', function () {
                var params = { add: 1, subtract: 2 };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add', 'subtract'], args: [[1], [2]] });
            });
            it('takes in single anon object with []', function () {
                var params = { add: [1, 2] };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[1, 2]] });
            });
            it('takes in single anon object with literal', function () {
                var params = { add: [1] };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[1]] });
            });
        });
        describe('#_normalizeStructuredObjects', function () {
            it('takes in single named single object with []', function () {
                var params = { name: 'add', params: [3] };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[3]] });
            });
            it('takes in single named single object with [..]', function () {
                var params = { name: 'add', params: [3, 3] };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[3, 3]] });
            });
            it('takes in single named single object with literal', function () {
                var params = { name: 'add', params: 2 };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[2]] });
            });
            it('takes in single named single object with [[]]', function () {
                var params = { name: 'add', params: [1, 2] };
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[1, 2]] });
            });
        });

        describe('_normalizeArrays', function () {
            it('takes in named object pairs', function () {
                var params = [{ name: 'add', params: [1, 2] }, { name: 'subtract', params: [2, 3] }];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add', 'subtract'], args: [[1, 2], [2, 3]] });
            });

            it('takes in single named object[] pairs', function () {
                var params = [{ name: 'add', params: [1, 2] }];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[1, 2]] });
            });

            it('takes in single named object literal pairs', function () {
                var params = [{ name: 'add', params: 1 }];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[1]] });
            });
            it('takes in single named single object literal pairs', function () {
                var params = [{ name: 'add', params: [3] }];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['add'], args: [[3]] });
            });

            it('takes in single arrays', function () {
                var params = ['init', 'reset'];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal({ ops: ['init', 'reset'], args: [[], []] });
            });

            it('takes in array pairs', function () {
                var params = ['add', 'subtract'];
                var args = [[1, 2], [2, 3]];
                var result = rutil.normalizeOperations(params, args);
                result.should.deep.equal({ ops: ['add', 'subtract'], args: [[1, 2], [2, 3]] });
            });

        });


        describe('_normalizeLiterals', function () {
            it('takes in string + arrays', function () {
                var result = rutil.normalizeOperations('echo', ['hello', 'world']); //Call echo with 2 parameters, hello and world
                result.should.deep.equal({ ops: ['echo'], args: [['hello', 'world']] });
            });

            it('takes in string + [arrays]', function () {
                var result = rutil.normalizeOperations('echo', [['hello', 'world']]);
                result.should.deep.equal({ ops: ['echo'], args: [[['hello', 'world']]] }); //Call echo with 1 parameter, [hello, world]
            });

            it('takes in string + literal', function () {
                var result = rutil.normalizeOperations('echo', 'hello'); //Call echo with 1 parameter, hello
                result.should.deep.equal({ ops: ['echo'], args: [['hello']] });
            });
            it('takes in string + [literal]', function () {
                var result = rutil.normalizeOperations('echo', ['hello']); //Call echo with 1 parameter, hello
                result.should.deep.equal({ ops: ['echo'], args: [['hello']] });
            });
            it('takes in string + [[literal]]', function () {
                var result = rutil.normalizeOperations('echo', [['hello']]); //Call echo with 1 parameter, [hello]
                result.should.deep.equal({ ops: ['echo'], args: [[['hello']]] });
            });
            it('takes in string  + nothing', function () {
                var result = rutil.normalizeOperations('echo'); //Call echo with no parameters
                result.should.deep.equal({ ops: ['echo'], args: [[]] });
            });
        });


        it('takes in a combination single arrays and objects', function () {
            var params = ['init', 'reset', { add: [1, 2] }];
            var result = rutil.normalizeOperations(params);
            result.should.deep.equal({ ops: ['init', 'reset', 'add'], args: [[], [], [1, 2]] });
        });
    });
});
