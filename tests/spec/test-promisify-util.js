(function() {
    var futil = F.util;

    describe('Promisify utilities', function () {
        var MockFunction;
        var clock;
        var SLOW, MEDIUM, FAST;
        before(function() {
            SLOW = 300;
            MEDIUM = 200;
            FAST = 100;

            clock = sinon.useFakeTimers();

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
            clock.restore();
        });

        it.skip('#should chain functions', function () {
            var mf = new MockFunction();
            // mf.doSlow().doFast().doMedium();
        });
        it('#should be thenable', function() {
            var cb = sinon.spy();
            var mf = new MockFunction();
            mf.doFast('fast').then(cb);

            clock.tick(FAST);

            cb.should.have.been.called;
            cb.should.have.been.calledWith('fast');
            cb.should.have.been.calledOn(mf);
        });
    });
}());
