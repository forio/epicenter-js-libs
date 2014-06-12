(function() {

    var rutil = F.util.run;

    describe('Run Utilities', function () {
       describe('#normalizeOperations()', function () {

            it('takes in named object pairs', function () {
                var params =  [{name: 'add', params: [1,2]}, {name: 'subtract', params: [2,3]}];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal([['add', 'subtract'], [[1,2], [2,3]]]);
            });

            it('takes in anon objects', function () {
                var params =  {add: [1,2], subtract: [2,3]};
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal([['add', 'subtract'], [[1,2], [2,3]]]);
            });
            it('takes in literal values', function () {
                var result = rutil.normalizeOperations('add', [1,2]);
                result.should.deep.equal([['add'], [[1,2]]]);
            });


            it('takes in array pairs', function () {
                var params =  ['add', 'subtract'];
                var args = [[1,2], [2,3]];
                var result = rutil.normalizeOperations(params, args);
                result.should.deep.equal([['add', 'subtract'], [[1,2], [2,3]]]);
            });

            it('takes in single arrays', function () {
                var params =  ['init', 'reset'];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal([['init', 'reset'],[undefined, undefined]]);
            });

            it('takes in single arrays and objects', function() {
                var params =  ['init', 'reset', {add: [1,2]}];
                var result = rutil.normalizeOperations(params);
                result.should.deep.equal([['init', 'reset', 'add'],[undefined, undefined, [1,2]]]);
            });
        });
    });
}());
