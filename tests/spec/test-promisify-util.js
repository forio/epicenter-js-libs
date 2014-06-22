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
                       return 42;
                    }
                };
                $.extend(this, publicAPI);
                futil.promisify(this);
            };

            window.m  = new MockFunction();

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

        it('#should return a promise on then', function () {
            var cb1 = sinon.spy();
            var cb2 = sinon.spy();
            var mf = new MockFunction();
            var ret = mf.doFast('fast').then(cb1).then(cb2);

            clock.tick(FAST);

            cb1.should.have.been.called;
            cb2.should.have.been.called;

        });

        it('#should return itself on then', function () {
            var cb1 = sinon.spy();
            var cb2 = sinon.spy();
            var mf = new MockFunction();
            // var ret = mf.doFast('fast').then(cb1);
            var ret = mf.doSlow('slow').then(cb1).doFast('fast').then(cb2);

            clock.tick(SLOW);
            cb1.should.have.been.called;
            cb2.should.not.have.been.called;

            clock.tick(FAST);
            cb2.should.have.been.called;

            cb1.should.have.been.calledBefore(cb2);
        });

        it('#should chain functions', function () {
            var mf = new MockFunction();
            var slowSpy = sinon.spy(mf, 'doSlow');

            var slow = slowSpy('slow');

            var fastSpy = sinon.spy(slow, 'doFast');
            var fast = fastSpy('fast');

            var mediumSpy = sinon.spy(fast, 'doMedium');
            var medium = mediumSpy('medium');

            slowSpy.should.have.been.called;
            slowSpy.should.have.been.calledWith('slow');

            fastSpy.should.have.been.called;
            fastSpy.should.have.been.calledWith('fast');

            mediumSpy.should.have.been.called;
            mediumSpy.should.have.been.calledWith('medium');

        });

        it('should have executed chained functions in the right order', function () {
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

        it('should run multiple queries in parallel', function () {
            var mf = new MockFunction();
            var cb1 = sinon.spy();
            var cb2 = sinon.spy();

            mf.doFast(1).then(cb1);
            mf.doFast(2).then(cb2);

            clock.tick(FAST);

            cb1.should.have.been.called;
            cb2.should.have.been.called;
        });
        // describe('Synchronous functions', function () {
        //     it('should not be thenable', function () {
        //         var mf = new MockFunction();
        //         var ret = mf.doNow();

        //         ret.should.equal(42);
        //     });
        // });
    });
}());
