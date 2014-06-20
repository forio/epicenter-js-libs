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

                    doSlow: function(echo) {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            $d.resolve(echo);
                        }, SLOW);
                        return $d.promise();
                    },
                    doMedium: function(echo) {
                        var $d= $.Deferred();
                        setTimeout(function() {
                            $d.resolve(echo);
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

        it('#should be thenable', function() {
            var cb = sinon.spy();
            var mf = new MockFunction();
            mf.doFast('fast').then(cb);

            clock.tick(FAST);

            cb.should.have.been.called;
            cb.should.have.been.calledWith('fast');
            cb.should.have.been.calledOn(mf);
        });

        it.skip('#should return itself on then', function () {
            var cb = sinon.spy();
            var mf = new MockFunction();
            var ret = mf.doFast('fast').then(cb);

            console.log(ret);
            // ret.should.be.instanceOf(mf);
        });

        it('#should chain functions', function () {
            var mf = new MockFunction();
            var slowSpy = sinon.spy(mf, 'doSlow');

            var slow = slowSpy('slow');

            var fastSpy = sinon.spy(slow, 'doFast');
            var fast = fastSpy('fast');

            var mediumSpy = sinon.spy(fast, 'doMedium');
            var medium = mediumSpy('medium');

            // clock.tick(SLOW);

            slowSpy.should.have.been.called;
            slowSpy.should.have.been.calledWith('slow');

            fastSpy.should.have.been.called;
            fastSpy.should.have.been.calledWith('fast');

            mediumSpy.should.have.been.called;
            mediumSpy.should.have.been.calledWith('medium');

        });

        it('#should have executed chained functions in the right order', function () {
            var mf = new MockFunction();
            var slowSpy = sinon.spy(mf, 'doSlow');

            var slow = slowSpy('slow');

            var fastSpy = sinon.spy(slow, 'doFast');
            var fast = fastSpy('fast');

            var mediumSpy = sinon.spy(fast, 'doMedium');
            var medium = mediumSpy('medium');

            slowSpy.should.have.been.calledBefore(fastSpy);
            slowSpy.should.have.been.calledBefore(mediumSpy);

            fastSpy.should.have.been.calledBefore(mediumSpy);
        });
    });
}());
