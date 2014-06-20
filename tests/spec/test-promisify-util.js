(function() {
    var futil = F.util;

    describe('Promisify utilities', function () {
        var MockFunction;

        before(function() {
            var SLOW = 300;
            var MEDIUM = 200;
            var FAST = 100;

            MockFunction = function() {
                var publicAPI = {

                    doSlow: function() {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            $d.resolve('slow');
                        }, SLOW);
                        return $d.promise();
                    },
                    doMedium: function() {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            $d.resolve('medium');
                        }, MEDIUM);
                        return $d.promise();
                    },
                    doFast: function(echo) {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            $d.resolve(echo);
                        }, FAST);
                        return $d.promise();
                    },
                    doNow: function() {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            $d.resolve('slow');
                        }, SLOW);
                        return $d.promise();
                    }
                };
                publicAPI = futil.promisify.call(this, publicAPI);
                $.extend(this, publicAPI);
            };


        });
        after(function() {
            MockFunction = null;

        });

        it.skip('#should chain functions', function () {
            var mf = new MockFunction();
            // mf.doSlow().doFast().doMedium();
        });
        it('#should be thenable', function() {
            var cb = sinon.spy(function(){console.log('spy called!', arguments);});
            var mf = new MockFunction();
            mf.doFast('fast').then(spy);

            // cb.should.have.been.called;
            // cb.should.have.been.calledWith('fast');
            // cb.should.have.been.calledOn(mf);
        });
    });
}());
